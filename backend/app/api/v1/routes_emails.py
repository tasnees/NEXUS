from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
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
        http://localhost:5173/portal/assessment-portal

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

@router.post("/launch-assessment")
async def launch_assessment_emails(
    payload: LaunchRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Finds candidates for the job and sends them an email in the background.
    """
    # If candidate_emails is not provided in payload, find them in DB
    emails = payload.candidate_emails
    if not emails:
        candidates = db.query(Candidate).filter(Candidate.applied_job == payload.job_name).all()
        emails = [c.email for c in candidates if c.email]

    if not emails:
        raise HTTPException(status_code=404, detail=f"No candidates found for job: {payload.job_name}")

    # Queue background tasks for each email
    for email in emails:
        background_tasks.add_task(send_email_task, email, payload.job_name, payload.assessment_details)

    return {
        "status": "success",
        "message": f"Queued assessment emails for {len(emails)} candidates.",
        "candidates_notified": emails
    }
