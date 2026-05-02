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
    except smtplib.SMTPAuthenticationError:
        print(f"❌ SMTP AUTH ERROR: Username or Password rejected for {SENDER_EMAIL}. If using Gmail, please ensure you are using an 'App Password' (16 characters) and not your regular account password.")
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {e}")

class ScheduleRequest(BaseModel):
    job_name: str
    assessment_id: str
    title: str
    candidate_emails: Optional[List[str]] = None

def send_schedule_email_task(to_email: str, job_name: str, assessment_title: str):
    """Background task to send assessment scheduling email with Google Calendar link."""
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"SMTP credentials missing. Would have sent scheduling email to {to_email}.")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg['From'] = SENDER_EMAIL
        msg['To'] = to_email
        msg['Subject'] = f"📅 Schedule Your Assessment: {assessment_title} – {job_name}"

        calendar_link = "https://calendar.app.google/3zzaWT5e1bfgEnF97"

        plain = f"""Hello,

You have been invited to schedule your technical assessment for the {job_name} position.

Assessment: {assessment_title}

Please use the link below to pick a time that works for you:
{calendar_link}

Once you select a time, you will receive a confirmation email with your assessment portal link.

Best regards,
HireSync AI Platform
"""
        html = f"""
<html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#0F172A">
  <div style="background:linear-gradient(135deg,#3B82F6,#8B5CF6);padding:32px;border-radius:16px 16px 0 0;text-align:center">
    <h1 style="color:white;margin:0;font-size:24px">📅 Schedule Your Assessment</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0">{job_name}</p>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 16px 16px">
    <p style="color:#475569">Hello,</p>
    <p style="color:#475569">You have been selected to proceed with a technical assessment for the <strong>{job_name}</strong> position.</p>
    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin:24px 0">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.1em">Assessment</p>
      <p style="margin:0;font-size:18px;font-weight:700;color:#0F172A">{assessment_title}</p>
    </div>
    <p style="color:#475569">Please click the button below to choose a time that works for you:</p>
    <div style="text-align:center;margin:32px 0">
      <a href="{calendar_link}" style="background:#3B82F6;color:white;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block">
        📅 Choose Your Assessment Time
      </a>
    </div>
    <p style="color:#94A3B8;font-size:12px;text-align:center">You will receive your assessment portal link after confirming your slot.</p>
  </div>
</body></html>
"""
        msg.attach(MIMEText(plain, 'plain'))
        msg.attach(MIMEText(html, 'html'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Scheduling email sent to {to_email}")
    except smtplib.SMTPAuthenticationError:
        print(f"❌ SMTP AUTH ERROR: Scheduling email failed for {SENDER_EMAIL}. App Password required.")
    except Exception as e:
        print(f"❌ Failed to send scheduling email to {to_email}: {e}")

from sqlalchemy import func

@router.post("/launch-assessment")
async def launch_assessment_emails(
    payload: LaunchRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Finds candidates for the job and sends them an evaluation email."""
    
    # ── Ultra-Leniency Engine ──
    def get_stems(text):
        if not text: return set()
        words = re.findall(r'\w+', text.lower())
        return {w[:5] for w in words if len(w) > 2}

    def robust_match_candidates(job_name: str):
        query = job_name.lower().strip()
        job_stems = get_stems(query)
        all_cands = db.query(Candidate).all()
        matches = []
        for c in all_cands:
            if not c.applied_job: continue
            cand_job = c.applied_job.lower().strip()
            # 1. Stem Check
            if job_stems.intersection(get_stems(cand_job)):
                matches.append(c)
            # 2. Substring Match
            elif query in cand_job or cand_job in query:
                matches.append(c)
        return matches

    emails = payload.candidate_emails
    if not emails:
        matching_candidates = robust_match_candidates(payload.job_name)
        emails = [c.email for c in matching_candidates if c.email]

    if not emails:
        all_count = db.query(Candidate).count()
        return {
            "status": "error", 
            "message": f"Launch Failed: No candidates found for '{payload.job_name}'. Checked {all_count} records."
        }

    # Dispatch Emails
    for email in emails:
        background_tasks.add_task(send_email_task, email, payload.job_name, payload.assessment_details)

    return {"status": "success", "message": f"Successfully queued {len(emails)} assessment invitation(s)."}

@router.get("/matching-candidates")
async def get_matching_candidates(job_name: str, db: Session = Depends(get_db)):
    """Returns a list of candidates that match a job name to preview dispatch."""
    
    def get_stems(text):
        if not text: return set()
        words = re.findall(r'\w+', text.lower())
        return {w[:5] for w in words if len(w) > 2}

    def robust_match_candidates(job_name: str):
        query = job_name.lower().strip()
        job_stems = get_stems(query)
        all_cands = db.query(Candidate).all()
        matches = []
        for c in all_cands:
            if not c.applied_job: continue
            cand_job = c.applied_job.lower().strip()
            # 1. Stem Check
            if job_stems.intersection(get_stems(cand_job)):
                matches.append(c)
            # 2. Substring Match
            elif query in cand_job or cand_job in job_query:
                matches.append(c)
        return matches

    job_query = job_name # For the closure
    matches = robust_match_candidates(job_name)
    return [{
        "id": c.id,
        "name": c.name,
        "email": c.email,
        "job": c.applied_job
    } for c in matches]

@router.post("/schedule-interview")
async def schedule_interview_emails(
    payload: ScheduleRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Sends scheduling links to candidates using the same robust matching engine."""
    
    def get_stems(text):
        if not text: return set()
        words = re.findall(r'\w+', text.lower())
        return {w[:5] for w in words if len(w) > 2}

    def robust_match_candidates(job_name: str):
        query = job_name.lower().strip()
        job_stems = get_stems(query)
        all_cands = db.query(Candidate).all()
        matches = []
        for c in all_cands:
            if not c.applied_job: continue
            cand_job = c.applied_job.lower().strip()
            if job_stems.intersection(get_stems(cand_job)) or query in cand_job or (job_query in cand_job or cand_job in job_query):
                matches.append(c)
        return matches

    job_query = payload.job_name
    emails = payload.candidate_emails
    if not emails:
        matching_candidates = robust_match_candidates(payload.job_name)
        emails = [c.email for c in matching_candidates if c.email]

    if not emails:
        raise HTTPException(status_code=404, detail=f"No active candidates found for job '{payload.job_name}'.")

    for email in emails:
        background_tasks.add_task(send_schedule_email_task, email, payload.job_name, payload.title)

    return {"status": "success", "message": f"Scheduling links dispatched to {len(emails)} candidates."}
