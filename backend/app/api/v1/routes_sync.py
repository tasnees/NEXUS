"""
routes_sync.py
==============
Exposes a POST /api/v1/sync/ endpoint that triggers the Drive Sync
Orchestrator pipeline (Google Drive → Claude CV Analysis → DB upsert)
in a background thread so it doesn't block the HTTP response.

GET /api/v1/sync/status returns the result of the last run.
"""

import threading
from datetime import datetime
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

# ── in-memory state of the last sync run ──────────────────────────────────────
_sync_state: dict = {
    "running": False,
    "last_run": None,        # ISO timestamp
    "processed": 0,
    "skipped": 0,
    "failed": 0,
    "error": None,
}
_lock = threading.Lock()


class SyncStatus(BaseModel):
    running: bool
    last_run: Optional[str]
    processed: int
    skipped: int
    failed: int
    error: Optional[str]


def _run_sync_task():
    """Wrapper that runs the orchestrator and updates _sync_state."""
    import sys
    from pathlib import Path

    # Make sure backend root is on the path
    backend_dir = Path(__file__).parent.parent.parent.parent   # .../backend
    sys.path.insert(0, str(backend_dir))

    with _lock:
        _sync_state["running"] = True
        _sync_state["error"] = None

    try:
        # Import here (not at module level) so the router loads even if
        # google-api libs aren't installed yet.
        from drive_sync_orchestrator import run_sync, FOLDER_ID

        if not FOLDER_ID or FOLDER_ID == "YOUR_FOLDER_ID_HERE":
            with _lock:
                _sync_state["error"] = (
                    "GOOGLE_DRIVE_FOLDER_ID is not set in .env. "
                    "Please add the folder ID and restart the server."
                )
            return

        # Monkey-patch the orchestrator's summary counters so we can
        # read them back into _sync_state after the run.
        import drive_sync_orchestrator as _orch

        processed_ref = [0]
        skipped_ref   = [0]
        failed_ref    = [0]

        original_run_sync = _orch.run_sync

        def _patched_sync():
            """Thin wrapper to capture per-run counters."""
            import io, os, logging
            from pathlib import Path as _Path

            log = logging.getLogger("DriveSync")
            folder_id   = _orch.FOLDER_ID
            backend_url = _orch.BACKEND_API_URL

            if not folder_id:
                return

            service = _orch._build_drive_service()
            files   = _orch._list_files(service, folder_id)

            if not files:
                log.info("No supported files found in Drive folder.")
                return

            log.info("Found %d file(s) in Drive folder.", len(files))

            for file in files:
                file_id   = file["id"]
                filename  = file["name"]
                mime_type = file["mimeType"]

                if _orch._is_already_synced(file_id):
                    log.info("  ⏭  Skipping (already synced): %s", filename)
                    skipped_ref[0] += 1
                    continue

                log.info("  ▶  Processing: %s  (%s)", filename, mime_type)

                try:
                    file_bytes = _orch._download_file(service, file_id, mime_type)
                    raw_text   = _orch._extract_text(file_bytes, mime_type, filename)

                    if not raw_text.strip():
                        log.warning("     No text extracted from %s – skipping.", filename)
                        failed_ref[0] += 1
                        continue

                    log.info("     Running Claude CV analysis …")
                    from app.schemas.cv_extraction import extract_resume_fields
                    profile = extract_resume_fields(raw_text)

                    payload = {
                        "drive_file_id": file_id,
                        "filename":      filename,
                        "raw_text":      raw_text,
                        "name":          profile.name,
                        "email":         profile.email,
                        "phone":         profile.phone,
                        "summary":       profile.summary,
                        "skills":        profile.skills,
                        "experience":    profile.experience,
                        "education":     profile.education,
                    }

                    saved = _orch._save_to_db(payload)
                    if saved:
                        log.info(
                            "     ✅ Saved → id=%s  name=%s",
                            saved.get("id"), saved.get("name"),
                        )
                        processed_ref[0] += 1
                    else:
                        failed_ref[0] += 1

                except Exception as exc:
                    log.exception("     ❌ Error processing %s: %s", filename, exc)
                    failed_ref[0] += 1

        _patched_sync()

        with _lock:
            _sync_state["processed"] = processed_ref[0]
            _sync_state["skipped"]   = skipped_ref[0]
            _sync_state["failed"]    = failed_ref[0]

    except Exception as exc:
        with _lock:
            _sync_state["error"] = str(exc)
    finally:
        with _lock:
            _sync_state["running"]  = False
            _sync_state["last_run"] = datetime.utcnow().isoformat() + "Z"


# ── routes ────────────────────────────────────────────────────────────────────

@router.post("/", status_code=202)
def trigger_sync(background_tasks: BackgroundTasks):
    """
    Kick off the Drive → Claude → DB sync pipeline.
    Returns 202 Accepted immediately; the sync runs in the background.
    """
    with _lock:
        if _sync_state["running"]:
            raise HTTPException(status_code=409, detail="Sync is already running.")

    background_tasks.add_task(_run_sync_task)
    return {"message": "Sync started. Check GET /api/v1/sync/status for progress."}


@router.get("/status", response_model=SyncStatus)
def get_sync_status():
    """Return the result / status of the last (or current) sync run."""
    with _lock:
        return SyncStatus(**_sync_state)
