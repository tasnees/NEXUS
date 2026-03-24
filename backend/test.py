import os
import sys
import requests
from pathlib import Path

# Add core backend to path
sys.path.append(os.getcwd())

import drive_sync_orchestrator as orch
from app.schemas.cv_extraction import extract_resume_fields

from app.config.database import SessionLocal, engine, Base
from app.models.candidate import Candidate

# Ensure tables exist
Base.metadata.create_all(bind=engine)

def sync_all_drive_cvs():
    print("Connecting to Google Drive...")
    try:
        service = orch._build_drive_service()
        files = orch._list_files(service, orch.FOLDER_ID)
        
        if not files:
            print(f"No files found in folder {orch.FOLDER_ID}")
            return

        print(f"Found {len(files)} files. Starting sync...")
        
        db = SessionLocal()
        for file in files:
            file_id = file["id"]
            filename = file["name"]
            mime_type = file["mimeType"]

            print(f"Processing {filename}...")
            file_bytes = orch._download_file(service, file_id, mime_type)
            raw_text = orch._extract_text(file_bytes, mime_type, filename)
            
            if not raw_text.strip():
                print(f"  Skipping {filename}: No text extracted.")
                continue

            # 1. Extract fields using backend heuristics
            profile = extract_resume_fields(raw_text)
            
            # 2. Build payload for candidate DB
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

            # 3. Save to database directly
            try:
                existing = db.query(Candidate).filter(Candidate.drive_file_id == file_id).first()
                if existing:
                    for key, value in payload.items():
                        setattr(existing, key, value)
                    print(f"  ✅ Updated in DB: Name={payload.get('name')}")
                else:
                    new_candidate = Candidate(**payload)
                    db.add(new_candidate)
                    print(f"  ✅ Created in DB: Name={payload.get('name')}")
                db.commit()
            except Exception as e:
                db.rollback()
                print(f"  ❌ Failed to save to DB: {e}")

        db.close()
        print("Sync complete!")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    sync_all_drive_cvs()
