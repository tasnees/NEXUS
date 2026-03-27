from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import re
from dotenv import load_dotenv

from app.config.database import get_db
from app.models.candidate import Candidate

router = APIRouter()

load_dotenv()

# Email Config (Should be in .env)
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", SMTP_USER)

class AssessmentDetails(BaseModel):
    assessment_id: str
    title: str
    description: str
    duration: str
    difficulty: str
    focus_areas: List[str]

class LaunchRequest(BaseModel):
    job_name: str
    assessment_details: AssessmentDetails
    candidate_emails: Optional[List[str]] = None

def send_email_task(to_email: str, job_name: str, assessment: AssessmentDetails):
    """Background task to send email via SMTP."""
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"SMTP credentials missing. Would have sent email to {to_email} for {job_name}.")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = to_email
        msg['Subject'] = f"🚀 Evaluation: New Skill Assessment for {job_name}"

        # Build Email Body
        portal_link = f"http://localhost:5173/portal/assessment-portal?assessment_id={assessment.assessment_id}&email={to_email}"
        focus_str = ", ".join(assessment.focus_areas)
        body = f"""
        Hello Candidate,

        You are invited to complete an AI-driven proficiency assessment for the position of {job_name}.

        Assessment Details:
        - Title: {assessment.title}
        - Description: {assessment.description}
        - Duration: {assessment.duration}
        - Difficulty: {assessment.difficulty}
        - Focus Areas: {focus_str}

        Please click the link below to initialize your evaluation environment:
        {portal_link}

        Good luck,
        The NexHire AI Pipeline
        """
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Email successfully sent to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")

class ScheduleRequest(BaseModel):
    job_name: str
    assessment_id: str
    title: str
    candidate_emails: Optional[List[str]] = None

def send_schedule_email_task(to_email: str, job_name: str, assessment_title: str):
    """Background task to send scheduling email."""
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"SMTP credentials missing. Would have sent scheduling email to {to_email}.")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = to_email
        msg['Subject'] = f"📅 Schedule Your Interview: {job_name} - {assessment_title}"

        # Google Calendar Appointment Slots link (Placeholder - replace with actual sstoken)
        calendar_link = "https://calendar.google.com/calendar/selfsched?sstoken=https://calendar.app.google/n2JRv629z27Yb2Vq5"
        
        body = f"Schedule time for assessment for job {job_name}: {calendar_link}"
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Scheduling email sent to {to_email}")
    except Exception as e:
        print(f"Failed to send scheduling email to {to_email}: {e}")

from sqlalchemy import func

@router.post("/launch-assessment")
async def launch_assessment_emails(
    payload: LaunchRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Finds candidates for the job and sends them an evaluation email."""
    emails = payload.candidate_emails
    if not emails:
        job_query = payload.job_name.lower().strip()
        # "Ultra-Leniency" normalization: get root stems
        # e.g. "design", "designer", "designing" -> all share "design"
        def get_stems(text):
            words = re.findall(r'\w+', text.lower())
            return {w[:5] for w in words if len(w) > 2} # Match first 5 chars
            
        job_stems = get_stems(job_query)
        
        # Advanced Matching Engine
        all_candidates = db.query(Candidate).all()
        matching_candidates = []
        
        print(f"--- LAUNCH: Matching for job '{job_query}' ---")
        
        for c in all_candidates:
            if not c.applied_job:
                continue

            cand_job = c.applied_job.lower().strip()
            # 1. Stem Check
            cand_stems = get_stems(cand_job)
            stem_match = bool(job_stems.intersection(cand_stems))
            
            # 2. String Match (substring/contains)
            string_match = (job_query in cand_job or cand_job in job_query)
            
            # 3. Fuzzy Stem Check
            fuzzy_match = any(s in cand_job for s in job_stems)

            if stem_match or string_match or fuzzy_match:
                print(f"  ✅ MATCH FOUND: {c.name} ({cand_job})")
                matching_candidates.append(c)
            else:
                print(f"  ❌ NO MATCH: {c.name} ({cand_job})")

        emails = [c.email for c in matching_candidates if c.email]
        print(f"Final email list: {emails}")

    if not emails:
        return {
            "status": "error", 
            "message": f"Launch Failed: No candidates found for '{payload.job_name}'. Total checked: {len(all_candidates)}.",
            "job_stems": list(job_stems)
        }

    # Dispatch Emails
    for email in emails:
        background_tasks.add_task(send_email_task, email, payload.job_name, payload.assessment_details)

    return {"status": "success", "message": f"Successfully queued {len(emails)} assessment invitation(s)."}

@router.post("/schedule-interview")
async def schedule_interview_emails(
    payload: ScheduleRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Sends scheduling links to candidates who passed the assessment phase."""
    emails = payload.candidate_emails
    if not emails:
        job_query = payload.job_name.lower().strip()
        candidates = db.query(Candidate).filter(
            func.lower(Candidate.applied_job).contains(job_query)
        ).all()
        emails = [c.email for c in candidates if c.email]

    if not emails:
        raise HTTPException(status_code=404, detail=f"No active candidates found for job matching '{payload.job_name}'.")

    for email in emails:
        background_tasks.add_task(send_schedule_email_task, email, payload.job_name, payload.title)

    return {"status": "success", "message": f"Scheduling links dispatched to {len(emails)} candidates."}
