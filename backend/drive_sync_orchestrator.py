"""
drive_sync_orchestrator.py
==========================
Synchronizer service: Fetches resumes from a Google Drive folder,
runs them through the Claude-powered CV analyser, and upserts the
results into the NEXUS backend database via the /api/v1/candidates API.

Usage
-----
    python drive_sync_orchestrator.py

Environment variables required (add to .env):
    GOOGLE_DRIVE_FOLDER_ID   – the Drive folder to watch
    BACKEND_API_URL          – base URL of the FastAPI server
                               (default: http://localhost:8001)
    ANTHROPIC_API_KEY        – Claude API key (already used by cv_extraction)

Authentication
--------------
The script uses a Service Account JSON file for Google Drive access.
Place the file at:  backend/app/models/service_account.json
OR set GOOGLE_SERVICE_ACCOUNT_JSON_PATH in your .env.

If you only have OAuth2 credentials (credentials.json / token.json),
set USE_OAUTH=true in .env and the script will fall back to that flow.
"""

import io
import os
import sys
import json
import logging
import time
import requests

from pathlib import Path
from typing import Optional

# ── handle imports whether run from repo root or backend/ ──────────────────────
BACKEND_DIR = Path(__file__).parent
sys.path.insert(0, str(BACKEND_DIR))

# Google API
from google.oauth2 import service_account
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

# Internal
from app.services.pdf_extractor import PDFExtractor
from app.schemas.cv_extraction import extract_resume_fields

# ── logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("DriveSync")

# ── config ─────────────────────────────────────────────────────────────────────
from dotenv import load_dotenv
load_dotenv(BACKEND_DIR / ".env")

FOLDER_ID               = os.getenv("GOOGLE_DRIVE_FOLDER_ID", "")
BACKEND_API_URL         = os.getenv("BACKEND_API_URL", "http://localhost:8001")
CANDIDATES_ENDPOINT     = f"{BACKEND_API_URL}/api/v1/candidates/"
USE_OAUTH               = os.getenv("USE_OAUTH", "false").lower() == "true"
SERVICE_ACCOUNT_PATH    = os.getenv(
    "GOOGLE_SERVICE_ACCOUNT_JSON_PATH",
    str(BACKEND_DIR / "app" / "models" / "service_account.json"),
)
OAUTH_CREDENTIALS_PATH  = str(BACKEND_DIR / "app" / "models" / "credentials.json")
OAUTH_TOKEN_PATH        = str(BACKEND_DIR / "app" / "models" / "token.json")

SUPPORTED_MIME_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    # Google Docs in the folder → export as plain text
    "application/vnd.google-apps.document": "gdoc",
}

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]


# ── auth ───────────────────────────────────────────────────────────────────────
def _build_drive_service():
    """Return an authenticated Google Drive API service client."""
    if USE_OAUTH:
        creds = None
        token_path = Path(OAUTH_TOKEN_PATH)
        if token_path.exists():
            creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(GoogleRequest())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    OAUTH_CREDENTIALS_PATH, SCOPES
                )
                creds = flow.run_local_server(port=0)
            token_path.write_text(creds.to_json())
        log.info("Authenticated via OAuth2 (credentials.json / token.json)")
    else:
        if not Path(SERVICE_ACCOUNT_PATH).exists():
            raise FileNotFoundError(
                f"Service account JSON not found at: {SERVICE_ACCOUNT_PATH}\n"
                "Either place the file there or set GOOGLE_SERVICE_ACCOUNT_JSON_PATH "
                "in your .env, or set USE_OAUTH=true to use OAuth2 instead."
            )
        creds = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_PATH, scopes=SCOPES
        )
        log.info("Authenticated via Service Account: %s", SERVICE_ACCOUNT_PATH)

    return build("drive", "v3", credentials=creds)


# ── helpers ────────────────────────────────────────────────────────────────────
def _list_files(service, folder_id: str) -> list[dict]:
    """Return all files in the Drive folder that we can process."""
    mime_filter = " or ".join(
        [f"mimeType='{m}'" for m in SUPPORTED_MIME_TYPES]
    )
    query = f"'{folder_id}' in parents and ({mime_filter}) and trashed=false"
    results = (
        service.files()
        .list(q=query, fields="files(id, name, mimeType)", pageSize=100)
        .execute()
    )
    return results.get("files", [])


def _download_file(service, file_id: str, mime_type: str) -> bytes:
    """Download a Drive file and return its raw bytes."""
    if mime_type == "application/vnd.google-apps.document":
        # Export Google Doc as plain text
        request = service.files().export_media(
            fileId=file_id, mimeType="text/plain"
        )
    else:
        request = service.files().get_media(fileId=file_id)

    buffer = io.BytesIO()
    downloader = MediaIoBaseDownload(buffer, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()
    buffer.seek(0)
    return buffer.read()


def _extract_text(file_bytes: bytes, mime_type: str, filename: str) -> str:
    """Extract raw text from downloaded bytes."""
    if mime_type == "application/vnd.google-apps.document":
        # Already plain text from export
        return file_bytes.decode("utf-8", errors="ignore")

    if mime_type == "application/pdf":
        stream = io.BytesIO(file_bytes)
        extractor = PDFExtractor(file_stream=stream)
        return extractor.extract_text()

    if mime_type.endswith("wordprocessingml.document"):
        # docx → use python-docx if available, else fall back to PyPDF2
        try:
            import docx
            stream = io.BytesIO(file_bytes)
            doc = docx.Document(stream)
            return "\n".join(p.text for p in doc.paragraphs)
        except ImportError:
            log.warning(
                "python-docx not installed – cannot parse .docx files. "
                "Run: pip install python-docx"
            )
            return ""

    return ""


def _is_already_synced(drive_file_id: str) -> bool:
    """Check if a candidate record with this drive_file_id already exists."""
    try:
        r = requests.get(CANDIDATES_ENDPOINT, timeout=10)
        if r.ok:
            candidates = r.json()
            return any(c["drive_file_id"] == drive_file_id for c in candidates)
    except Exception as exc:
        log.warning("Could not reach backend to check existing records: %s", exc)
    return False


def _save_to_db(payload: dict) -> Optional[dict]:
    """POST / upsert the candidate profile to the backend API."""
    try:
        r = requests.post(CANDIDATES_ENDPOINT, json=payload, timeout=30)
        r.raise_for_status()
        return r.json()
    except Exception as exc:
        log.error("Failed to save candidate to database: %s", exc)
        return None


# ── main pipeline ──────────────────────────────────────────────────────────────
def run_sync():
    """Full synchronization pass: Discover → Download → Analyse → Save."""
    if not FOLDER_ID:
        log.error(
            "GOOGLE_DRIVE_FOLDER_ID is not set. "
            "Add it to your .env file and try again."
        )
        return

    log.info("═" * 60)
    log.info("  NEXUS Drive Sync – starting pass")
    log.info("  Folder ID : %s", FOLDER_ID)
    log.info("  Backend   : %s", BACKEND_API_URL)
    log.info("═" * 60)

    service = _build_drive_service()
    files   = _list_files(service, FOLDER_ID)

    if not files:
        log.info("No supported files found in Drive folder.")
        return

    log.info("Found %d file(s) in Drive folder.", len(files))
    processed = skipped = failed = 0

    for file in files:
        file_id   = file["id"]
        filename  = file["name"]
        mime_type = file["mimeType"]

        # ── idempotency guard ──────────────────────────────────────────────
        if _is_already_synced(file_id):
            log.info("  ⏭  Skipping (already synced): %s", filename)
            skipped += 1
            continue

        log.info("  ▶  Processing: %s  (%s)", filename, mime_type)

        try:
            # 1. Download
            file_bytes = _download_file(service, file_id, mime_type)

            # 2. Extract raw text
            raw_text = _extract_text(file_bytes, mime_type, filename)
            if not raw_text.strip():
                log.warning("     No text extracted from %s – skipping.", filename)
                failed += 1
                continue

            # 3. Run Claude analysis
            log.info("     Running Claude CV analysis …")
            profile = extract_resume_fields(raw_text)

            # 4. Build DB payload
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

            # 5. Save to database
            saved = _save_to_db(payload)
            if saved:
                log.info(
                    "     ✅ Saved → id=%s  name=%s  email=%s",
                    saved.get("id"), saved.get("name"), saved.get("email"),
                )
                processed += 1
            else:
                failed += 1

        except Exception as exc:
            log.exception("     ❌ Error processing %s: %s", filename, exc)
            failed += 1

    log.info("─" * 60)
    log.info(
        "  Sync complete: %d processed | %d skipped | %d failed",
        processed, skipped, failed,
    )
    log.info("─" * 60)


# ── entry-point ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="NEXUS Drive Sync – pull resumes from Google Drive into the DB"
    )
    parser.add_argument(
        "--watch",
        action="store_true",
        help="Run continuously, polling every N seconds (default 60)",
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=60,
        metavar="SECONDS",
        help="Polling interval when --watch is set (default: 60s)",
    )
    args = parser.parse_args()

    if args.watch:
        log.info("Watch mode: polling every %ds. Press Ctrl+C to stop.", args.interval)
        while True:
            run_sync()
            time.sleep(args.interval)
    else:
        run_sync()
