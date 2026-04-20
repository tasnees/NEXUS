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

_calendar_sync_state: dict = {
    "running": False,
    "last_run": None,
    "new_events": 0,
    "error": None,
}

_lock = threading.Lock()
_calendar_lock = threading.Lock()


class SyncStatus(BaseModel):
    running: bool
    last_run: Optional[str]
    processed: int
    skipped: int
    failed: int
    error: Optional[str]


def _run_sync_task():
    """Wrapper that runs the modular orchestrator and updates _sync_state."""
    import sys
    from pathlib import Path

    # Make sure backend root is on the path
    backend_dir = Path(__file__).parent.parent.parent.parent   # .../backend
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))

    with _lock:
        _sync_state["running"] = True
        _sync_state["error"] = None

    try:
        from drive_sync_orchestrator import run_sync, FOLDER_ID
        
        if not FOLDER_ID or FOLDER_ID == "YOUR_FOLDER_ID_HERE":
            raise ValueError("GOOGLE_DRIVE_FOLDER_ID is not set in .env.")

        # Run the robust, recursive sync from the orchestrator
        processed, skipped, failed = run_sync()

        with _lock:
            _sync_state["processed"] = processed
            _sync_state["skipped"]   = skipped
            _sync_state["failed"]    = failed
            _sync_state["status"]    = "success"

        # Persistence
        from app.config.database import SessionLocal
        from app.models.sync_history import SyncHistory
        db = SessionLocal()
        try:
            history = SyncHistory(
                status="success",
                processed=processed,
                skipped=skipped,
                failed=failed
            )
            db.add(history)
            db.commit()
        finally:
            db.close()

    except Exception as exc:
        err_msg = str(exc)
        friendly_error = err_msg
        
        # Proactive troubleshooting for common Google API errors
        if "invalid_grant" in err_msg.lower():
            friendly_error = "Authentication failed (invalid_grant). Likely cause: System Clock out of sync. Please ensure your machine's time is synchronized with an NTP server."
        elif "quota" in err_msg.lower():
            friendly_error = "Google Drive API quota exceeded. Please wait a few minutes and try again."

        with _lock:
            _sync_state["error"] = friendly_error
            _sync_state["status"] = "failed"
        
        from app.config.database import SessionLocal
        from app.models.sync_history import SyncHistory
        db = SessionLocal()
        try:
            history = SyncHistory(
                status="failed",
                error=friendly_error
            )
            db.add(history)
            db.commit()
        finally:
            db.close()

    finally:
        with _lock:
            _sync_state["running"]  = False
            _sync_state["last_run"] = datetime.utcnow().isoformat() + "Z"


def _run_calendar_sync_task():
    """Wrapper for the calendar sync orchestrator."""
    with _calendar_lock:
        _calendar_sync_state["running"] = True
        _calendar_sync_state["error"] = None

    try:
        from calendar_sync_orchestrator import sync_interviews
        new_count, error = sync_interviews()
        
        with _calendar_lock:
            _calendar_sync_state["new_events"] = new_count
            if error:
                _calendar_sync_state["error"] = error
    except Exception as e:
        with _calendar_lock:
            _calendar_sync_state["error"] = str(e)
    finally:
        with _calendar_lock:
            _calendar_sync_state["running"] = False
            _calendar_sync_state["last_run"] = datetime.utcnow().isoformat() + "Z"


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

@router.get("/history")
def get_sync_history():
    """Fetch the last 10 sync operations from the database."""
    from app.config.database import SessionLocal
    from app.models.sync_history import SyncHistory
    db = SessionLocal()
    try:
        return db.query(SyncHistory).order_by(SyncHistory.timestamp.desc()).limit(10).all()
    finally:
        db.close()

@router.post("/calendar", status_code=202)
def trigger_calendar_sync(background_tasks: BackgroundTasks):
    """Trigger the Google Calendar → DB sync."""
    with _calendar_lock:
        if _calendar_sync_state["running"]:
            raise HTTPException(status_code=409, detail="Calendar sync is already running.")
    
    background_tasks.add_task(_run_calendar_sync_task)
    return {"message": "Calendar sync started."}

@router.get("/calendar/status")
def get_calendar_sync_status():
    """Return the status of the last calendar sync."""
    with _calendar_lock:
        return _calendar_sync_state
