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

# Scopes – Changed to full calendar access for read/write
SCOPES = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/calendar"
]

def get_calendar_service():
    """Build and return the Google Calendar service."""
    if not Path(SERVICE_ACCOUNT_PATH).exists():
        raise FileNotFoundError(f"Service account JSON not found at: {SERVICE_ACCOUNT_PATH}")
    
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_PATH, scopes=SCOPES
    )
    return build("calendar", "v3", credentials=creds), creds

def get_target_calendar_id(service):
    """Find the best calendar ID to use."""
    user_email = os.getenv("SMTP_USER", "").lower()
    
    try:
        calendar_list = service.calendarList().list().execute()
        items = calendar_list.get('items', [])
        
        if items:
            for cal in items:
                if cal.get('id', '').lower() == user_email:
                    return cal['id']
            return items[0]['id']
    except:
        pass
        
    return user_email if user_email else 'primary'

def sync_interviews():
    """Fetch calendar events and save to DB."""
    try:
        service, creds = get_calendar_service()
    except Exception as e:
        log.error(f"Failed to build calendar service: {e}")
        return 0, str(e)

    # Search window: 30 days back to 90 days forward
    now = datetime.utcnow()
    time_min = (now - timedelta(days=30)).isoformat() + "Z"
    time_max = (now + timedelta(days=90)).isoformat() + "Z"

    log.info(f"Syncing calendar from {time_min} to {time_max}...")
    
    try:
        target_calendar = get_target_calendar_id(service)
        log.info(f"Using calendar: {target_calendar}")
        
        events_result = service.events().list(
            calendarId=target_calendar, 
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        events = events_result.get('items', [])
    except Exception as e:
        log.error(f"Failed to list events: {e}")
        service_email = creds.service_account_email
        return 0, f"Google API Error: {str(e)}\n\nAction: Ensure you have shared your calendar with {service_email} AND that the 'Google Calendar API' is enabled in your Google Cloud Console."

    db = SessionLocal()
    new_count = 0
    try:
        from app.models.candidate import Candidate
        
        for event in events:
            ev_id = event.get('id')
            summary = event.get('summary', 'No Title')
            start = event['start'].get('dateTime', event['start'].get('date'))
            
            if not start:
                continue

            # 1. Clean the summary to get a potential candidate name
            candidate_name = summary.replace("Interview:", "").replace("Interview", "").split("<>")[0].strip()
            
            if not candidate_name or candidate_name == "No Title":
                continue

            event_date = datetime.fromisoformat(start.replace('Z', '+00:00')).replace(tzinfo=None)

            # 2. Match by GCal ID or (Name + Date)
            existing = db.query(Interview).filter(
                (Interview.gcal_event_id == ev_id) | 
                ((Interview.candidate_name == candidate_name) & (Interview.date == event_date))
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
                    status="scheduled",
                    gcal_event_id=ev_id
                )
                db.add(interview)
                new_count += 1
            elif existing and not existing.gcal_event_id:
                # Update existing local record with GCal ID if it was missing
                existing.gcal_event_id = ev_id
        
        db.commit()
        log.info(f"Sync complete. {new_count} new interviews imported.")
        return new_count, None
    except Exception as e:
        log.error(f"Error during DB upsert: {e}")
        return 0, str(e)
    finally:
        db.close()

def create_gcal_event(interview_data: dict):
    """Create an event on Google Calendar and return its ID."""
    try:
        service, _ = get_calendar_service()
        target_calendar = get_target_calendar_id(service)
        
        start_time = interview_data['date']
        if isinstance(start_time, str):
            start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        
        end_time = start_time + timedelta(hours=1)
        
        # Fetch allowed conference types for this calendar to avoid 400 Bad Request
        allowed_types = []
        try:
            cal_meta = service.calendars().get(calendarId=target_calendar).execute()
            allowed_types = cal_meta.get('conferenceProperties', {}).get('allowedConferenceSolutionTypes', [])
        except:
            pass

        # Case-insensitive check for Video Call
        is_video = False
        mean = str(interview_data.get('interview_mean', '')).lower()
        if 'video' in mean or 'meet' in mean or 'zoom' in mean:
            is_video = True
        
        # Only request conference if 'hangoutsMeet' or 'googleMeet' is allowed
        # Fallback: if list is empty but it's a video call, we try hangoutsMeet once and catch error
        request_conference = is_video and ('hangoutsMeet' in allowed_types or not allowed_types)

        event = {
            'summary': f"Interview: {interview_data['candidate_name']} <> NEXUS",
            'description': f"Role: {interview_data['role']}\nType: {interview_data['interview_type']}",
            'start': {
                'dateTime': start_time.isoformat(),
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': end_time.isoformat(),
                'timeZone': 'UTC',
            },
        }

        if request_conference:
            # Try multiple types in case of account-specific naming quirks
            # hangoutsMeet (GSuite/Modern), googleMeet (Standard), eventHangout (Legacy/Consumer fallback)
            potential_types = ['hangoutsMeet', 'googleMeet', 'eventHangout']
            if allowed_types:
                # Prioritize types that the calendar explicitly allows
                potential_types = [t for t in allowed_types if t in potential_types] + [t for t in potential_types if t not in allowed_types]
            
            created_event = None
            last_error = None

            for m_type in potential_types:
                try:
                    event['conferenceData'] = {
                        'createRequest': {
                            'requestId': f"nexus-{int(datetime.utcnow().timestamp())}-{m_type}",
                            'conferenceSolutionKey': {'type': m_type}
                        }
                    }
                    created_event = service.events().insert(
                        calendarId=target_calendar, 
                        body=event,
                        conferenceDataVersion=1
                    ).execute()
                    break # Success!
                except Exception as e:
                    last_error = e
                    log.info(f"Retrying GCal meeting with alternative type due to: {e}")
                    continue
            
            if not created_event:
                # Final fallback: create WITHOUT conference data
                log.warning(f"All conference types failed, falling back to standard event. Last error: {last_error}")
                if 'conferenceData' in event: 
                    del event['conferenceData']
                created_event = service.events().insert(
                    calendarId=target_calendar, 
                    body=event
                ).execute()
        else:
            # Case where it's not a video call
            created_event = service.events().insert(
                calendarId=target_calendar, 
                body=event
            ).execute()
        
        # Get hangoutLink or from conferenceData entryPoints
        meet_link = created_event.get('hangoutLink') if created_event else None
        if created_event and not meet_link and created_event.get('conferenceData'):
            entry_points = created_event['conferenceData'].get('entryPoints', [])
            for ep in entry_points:
                if ep.get('entryPointType') == 'video':
                    meet_link = ep.get('uri')
                    break
        
        return created_event.get('id') if created_event else None, meet_link
    except Exception as e:
        log.error(f"Failed to create GCal event: {e}")
        return None, None

def delete_gcal_event(gcal_event_id: str):
    """Remove an event from Google Calendar."""
    if not gcal_event_id:
        return False
    try:
        service, _ = get_calendar_service()
        target_calendar = get_target_calendar_id(service)
        service.events().delete(calendarId=target_calendar, eventId=gcal_event_id).execute()
        return True
    except Exception as e:
        log.error(f"Failed to delete GCal event {gcal_event_id}: {e}")
        return False

def update_gcal_event(gcal_event_id: str, interview_data: dict):
    """Update existing event on Google Calendar."""
    if not gcal_event_id:
        return False
    try:
        service, _ = get_calendar_service()
        target_calendar = get_target_calendar_id(service)
        
        # Get existing first to preserve other fields
        event = service.events().get(calendarId=target_calendar, eventId=gcal_event_id).execute()
        
        if 'candidate_name' in interview_data:
            event['summary'] = f"Interview: {interview_data['candidate_name']} <> NEXUS"
        
        if 'date' in interview_data:
            start_time = interview_data['date']
            if isinstance(start_time, str):
                start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            end_time = start_time + timedelta(hours=1)
            event['start'] = {'dateTime': start_time.isoformat(), 'timeZone': 'UTC'}
            event['end'] = {'dateTime': end_time.isoformat(), 'timeZone': 'UTC'}
            
        if 'role' in interview_data or 'interview_type' in interview_data:
            role = interview_data.get('role', 'Unknown')
            it_type = interview_data.get('interview_type', 'Unknown')
            event['description'] = f"Role: {role}\nType: {it_type}"

        service.events().update(calendarId=target_calendar, eventId=gcal_event_id, body=event).execute()
        return True
    except Exception as e:
        log.error(f"Failed to update GCal event {gcal_event_id}: {e}")
        return False

if __name__ == "__main__":
    count, err = sync_interviews()
    if err:
        print(f"FAILED: {err}")
    else:
        print(f"SUCCESS: {count} events imported.")
