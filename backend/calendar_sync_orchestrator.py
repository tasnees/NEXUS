"""
calendar_sync_orchestrator.py
=============================
Synchronizes Google Calendar events into the local Interviews database.
Uses the same service account logic as the Drive sync.
"""

import os
import sys
import logging
from datetime import datetime, timedelta
from pathlib import Path

# handle imports
BACKEND_DIR = Path(__file__).parent
sys.path.insert(0, str(BACKEND_DIR))

from google.oauth2 import service_account
from googleapiclient.discovery import build
from app.config.database import SessionLocal
from app.models.interview import Interview

# logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("CalendarSync")

# config
from dotenv import load_dotenv
load_dotenv(BACKEND_DIR / ".env")

SERVICE_ACCOUNT_PATH = os.getenv(
    "GOOGLE_SERVICE_ACCOUNT_JSON_PATH",
    str(BACKEND_DIR / "app" / "models" / "service_account.json"),
)

# Scopes – added calendar.readonly
SCOPES = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/calendar.readonly"
]

def sync_interviews():
    """Fetch calendar events and save to DB."""
    try:
        # Build creds first to have access to the email for error messages
        if not Path(SERVICE_ACCOUNT_PATH).exists():
            raise FileNotFoundError(f"Service account JSON not found at: {SERVICE_ACCOUNT_PATH}")
        
        creds = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_PATH, scopes=SCOPES
        )
        service = build("calendar", "v3", credentials=creds)
    except Exception as e:
        log.error(f"Failed to build calendar service: {e}")
        return 0, str(e)

    # Search window: 30 days back to 90 days forward
    now = datetime.utcnow()
    time_min = (now - timedelta(days=30)).isoformat() + "Z"
    time_max = (now + timedelta(days=90)).isoformat() + "Z"

    log.info(f"Syncing calendar from {time_min} to {time_max}...")
    
    try:
        # Try to find which calendars we have access to
        calendar_list = service.calendarList().list().execute()
        items = calendar_list.get('items', [])
        
        target_calendar = None
        user_email = os.getenv("SMTP_USER", "").lower()
        
        if items:
            # Look for the user's email in the list of shared calendars
            for cal in items:
                if cal.get('id', '').lower() == user_email:
                    target_calendar = cal['id']
                    break
            # Fallback to the first available calendar if no exact match
            if not target_calendar:
                target_calendar = items[0]['id']
        
        if not target_calendar:
            # Last resort fallback to the SMTP_USER env var if it's set
            target_calendar = user_email if user_email else 'primary'

        log.info(f"Using calendar: {target_calendar}")
        
        events_result = service.events().list(
            calendarId=target_calendar, 
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        events = events_result.get('items', [])
        calendar_id = target_calendar # for error logging
    except Exception as e:
        log.error(f"Failed to list events: {e}")
        service_email = creds.service_account_email
        return 0, f"Google API Error: {str(e)}\n\nAction: Ensure you have shared your calendar with {service_email} AND that the 'Google Calendar API' is enabled in your Google Cloud Console."

    db = SessionLocal()
    new_count = 0
    try:
        from app.models.candidate import Candidate
        
        for event in events:
            summary = event.get('summary', 'No Title')
            start = event['start'].get('dateTime', event['start'].get('date'))
            
            # 1. Clean the summary to get a potential candidate name
            # e.g. "John Doe <> Recruitment Team" or "Interview: John Doe"
            candidate_name = summary.replace("Interview:", "").replace("Interview", "").split("<>")[0].strip()
            
            if not candidate_name or candidate_name == "No Title":
                continue

            event_date = datetime.fromisoformat(start.replace('Z', '+00:00')).replace(tzinfo=None)

            # 2. Check if this specific event (name + date) is already synced
            existing = db.query(Interview).filter(
                Interview.candidate_name == candidate_name,
                Interview.date == event_date
            ).first()

            if not existing:
                # 3. Look up candidate in DB to get their target role
                role = "General Interview"
                cand_record = db.query(Candidate).filter(Candidate.name.ilike(f"%{candidate_name}%")).first()
                if cand_record and cand_record.applied_job:
                    role = cand_record.applied_job

                interview = Interview(
                    candidate_name=candidate_name,
                    role=role,
                    date=event_date,
                    interview_type="technical" if "technical" in summary.lower() else "screening",
                    status="scheduled"
                )
                db.add(interview)
                new_count += 1
        
        db.commit()
        log.info(f"Sync complete. {new_count} new interviews imported.")
        return new_count, None
    except Exception as e:
        log.error(f"Error during DB upsert: {e}")
        return 0, str(e)
    finally:
        db.close()

if __name__ == "__main__":
    count, err = sync_interviews()
    if err:
        print(f"FAILED: {err}")
    else:
        print(f"SUCCESS: {count} events imported.")
