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

FOLDER_ID               = os.getenv("GOOGLE_DRIVE_FOLDER_ID") or os.getenv("DRIVE_FOLDER_ID", "")
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

SCOPES = ["https://www.googleapis.com/auth/drive"]


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
                try:
                    creds.refresh(GoogleRequest())
                    token_path.write_text(creds.to_json())
                except Exception as e:
                    log.warning("Token refresh failed (likely expired): %s. Re-authenticating...", e)
                    creds = None
            
            if not creds:
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
        .list(q=query, fields="files(id, name, mimeType, parents)", pageSize=100)
        .execute()
    )
    return results.get("files", [])


def _get_or_create_folder(service, folder_name: str, parent_id: str) -> str:
    """Check if a folder exists under parent_id, else create it. Return folder_id."""
    query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and '{parent_id}' in parents and trashed=false"
    results = service.files().list(q=query, fields="files(id)").execute()
    files = results.get("files", [])
    if files:
        return files[0]["id"]

    # Create it
    file_metadata = {
        "name": folder_name,
        "mimeType": "application/vnd.google-apps.folder",
        "parents": [parent_id]
    }
    folder = service.files().create(body=file_metadata, fields="id").execute()
    return folder.get("id")


def _move_file(service, file_id: str, old_parent_id: str, new_parent_id: str):
    """Move a file from one folder to another."""
    if old_parent_id == new_parent_id:
        return
    try:
        service.files().update(
            fileId=file_id,
            addParents=new_parent_id,
            removeParents=old_parent_id,
            fields="id, parents"
        ).execute()
        log.info("     📂 Moved to job-specific folder.")
    except Exception as e:
        log.warning("     ⚠️ Could not move file: %s", e)


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


from app.config.database import SessionLocal, engine, Base
from app.models.candidate import Candidate
from app.models.job import Job

# Ensure tables exist
Base.metadata.create_all(bind=engine)

def get_existing_jobs():
    """Retrieve all jobs from the database for dynamic matching."""
    db = SessionLocal()
    try:
        return db.query(Job).all()
    except Exception as exc:
        log.warning("Could not fetch existing jobs: %s", exc)
        return []
    finally:
        db.close()

def _is_already_synced(drive_file_id: str) -> bool:
    """Check if a candidate record with this drive_file_id already exists."""
    db = SessionLocal()
    try:
        exists = db.query(Candidate).filter(Candidate.drive_file_id == drive_file_id).first() is not None
        return exists
    except Exception as exc:
        log.warning("Could not reach database to check existing records: %s", exc)
        return False
    finally:
        db.close()


def _save_to_db(payload: dict) -> Optional[dict]:
    """Upsert the candidate profile to the database directly."""
    db = SessionLocal()
    try:
        existing = db.query(Candidate).filter(
            Candidate.drive_file_id == payload["drive_file_id"]
        ).first()

        if existing:
            for field, value in payload.items():
                setattr(existing, field, value)
            db.commit()
            db.refresh(existing)
            # Convert model to dict for backward compatibility in return
            return {"id": existing.id, "name": existing.name, "email": existing.email}

        candidate = Candidate(**payload)
        db.add(candidate)
        db.commit()
        db.refresh(candidate)
        return {"id": candidate.id, "name": candidate.name, "email": candidate.email}
    except Exception as exc:
        db.rollback()
        log.error("Failed to save candidate to database: %s", exc)
        return None
    finally:
        db.close()


# ── main pipeline ──────────────────────────────────────────────────────────────
def _discover_folders_recursive(service, parent_id: str, discovered: dict):
    """Recursively find all subfolders and map their IDs to names."""
    query = f"'{parent_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false"
    results = service.files().list(q=query, fields="files(id, name)").execute()
    for f in results.get("files", []):
        discovered[f["id"]] = f["name"]
        _discover_folders_recursive(service, f["id"], discovered)

def run_sync():
    """Full recursive synchronization pass: Discover → Download → Analyse → Save."""
    if not FOLDER_ID:
        log.error("GOOGLE_DRIVE_FOLDER_ID is not set.")
        return

    log.info("═" * 60)
    log.info("  NEXUS Drive Sync – starting recursive pass")
    log.info("  Root Folder : %s", FOLDER_ID)
    log.info("═" * 60)

    service = _build_drive_service()
    
    # 1. Discover all folders in the hierarchy
    folder_map = {FOLDER_ID: None} # root has no pre-set job name by folder
    log.info("  Scanning sub-folders …")
    _discover_folders_recursive(service, FOLDER_ID, folder_map)
    log.info("  Found %d sub-folders.", len(folder_map) - 1)

    # 2. Accumulate all files from all folders
    all_files_to_sync = []
    for fid, job_name_hint in folder_map.items():
        files = _list_files(service, fid)
        for f in files:
            f["_job_hint"] = job_name_hint # Attach folder name as a job hint
        all_files_to_sync.extend(files)

    if not all_files_to_sync:
        log.info("No supported files found in the Drive hierarchy.")
        return

    log.info("Total files to process: %d", len(all_files_to_sync))
    processed = skipped = failed = 0

    for file in all_files_to_sync:
        file_id   = file["id"]
        filename  = file["name"]
        mime_type = file["mimeType"]
        job_hint  = file.get("_job_hint")

        if _is_already_synced(file_id):
            skipped += 1
            continue

        log.info("  ▶  Processing: %s", filename)

        try:
            # Download & Extract
            file_bytes = _download_file(service, file_id, mime_type)
            raw_text = _extract_text(file_bytes, mime_type, filename)
            
            if not raw_text.strip():
                failed += 1
                continue

            # Get existing jobs for AI context
            existing_jobs = get_existing_jobs()
            existing_titles = [j.title for j in existing_jobs]

            # Run Analysis (Guided)
            profile = extract_resume_fields(raw_text, existing_job_titles=existing_titles)

            # --- DYNAMIC JOB LABELING ---
            # Priority: 1. Manual Folder Name, 2. AI Extraction, 3. Filename Keywords, 4. CV Text Keywords, 5. Uncategorized
            applied_job = job_hint or profile.applied_job
            
            # Treat "Not provided" or empty results as uncategorized for internal processing
            if not applied_job or applied_job.lower() in ["not provided", "uncategorized", "n/a", "none"]:
                lower_file = filename.lower()
                lower_text = raw_text.lower()
                
                matched = False
                for job_title in existing_titles:
                    # Get core keywords from DB job titles, ignoring common short words
                    keywords = [k.lower().strip() for k in job_title.split() if len(k) > 3]
                    if not keywords: continue
                    
                    # Check filename first (stronger signal)
                    if any(k in lower_file for k in keywords):
                        applied_job = job_title
                        matched = True
                        break
                    
                    # Check raw text (weaker but good fallback)
                    if any(k in lower_text for k in keywords):
                        applied_job = job_title
                        matched = True
                        break
                
                if not matched:
                    applied_job = "Uncategorized"

            # Clean up the final label: ensure it's one of the official job titles if close
            if applied_job != "Uncategorized":
                for job_title in existing_titles:
                    if applied_job.lower() == job_title.lower():
                        applied_job = job_title # Use official casing
                        break

            # Build DB payload
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
                "applied_job":   applied_job,
            }

            # If it was in root, move it to its job folder (auto-organization)
            if not job_hint:
                target_folder_id = _get_or_create_folder(service, applied_job, FOLDER_ID)
                parents = file.get("parents", [FOLDER_ID])
                for parent_id in parents:
                    _move_file(service, file_id, parent_id, target_folder_id)

            # Save to database
            saved = _save_to_db(payload)
            if saved:
                log.info("     ✅ Synced → %s", saved.get("name"))
                processed += 1
            else:
                failed += 1

        except Exception as exc:
            log.exception("     ❌ Error: %s", exc)
            failed += 1

    log.info("─" * 60)
    log.info("  Pass complete: %d synced | %d skipped | %d failed", processed, skipped, failed)
    return processed, skipped, failed


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
