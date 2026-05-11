"""
AI Recruiter Router  –  /api/v1/recruiter
-----------------------------------------
Endpoints:
  POST /recruit/{candidate_id}   – Recruit a single candidate
  POST /recruit-batch            – Recruit all matching candidates for a job
  GET  /history                  – Return recruitment log (stored in DB candidate field)
"""

from datetime import datetime, timedelta
from typing import Optional, List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.candidate import Candidate
from app.models.interview import Interview
from app.services.ai_recruiter_service import (
    generate_recruiter_message,
    send_recruiter_email,
)

router = APIRouter()


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class RecruitRequest(BaseModel):
    """Body for single-candidate recruitment."""
    meet_link: Optional[str] = None         # Manual link or Google Meet
    interview_date: Optional[str] = None   # ISO string; defaults to tomorrow 10:00
    interview_type: Optional[str] = "screening"
    use_ai_agent: Optional[bool] = False   # If True, use the Nexus AI Interview Agent


class BatchRecruitRequest(BaseModel):
    """Body for recruiting all candidates matching a job."""
    job_name: str
    meet_link: Optional[str] = None
    interview_date: Optional[str] = None
    interview_type: Optional[str] = "screening"
    candidate_ids: Optional[List[int]] = None  # Override auto-match if provided
    use_ai_agent: Optional[bool] = False


# ── Helpers ───────────────────────────────────────────────────────────────────

def _default_date() -> str:
    tomorrow = datetime.now() + timedelta(days=1)
    return tomorrow.strftime("%A, %B %d %Y at 10:00 AM")


def _match_candidates_by_job(job_name: str, db: Session) -> List[Candidate]:
    """Stem-based fuzzy match – mirrors the logic in routes_emails.py."""
    import re

    def stems(text: str):
        words = re.findall(r"\w+", text.lower())
        return {w[:5] for w in words if len(w) > 2}

    q_stems = stems(job_name)
    q_lower = job_name.lower().strip()
    result  = []

    for c in db.query(Candidate).all():
        if not c.applied_job:
            continue
        cj = c.applied_job.lower().strip()
        if q_stems & stems(cj) or q_lower in cj or cj in q_lower:
            result.append(c)
    return result


def _do_recruit(candidate: Candidate, role: str, meet_link: str, interview_date: str, interview_type: str, db: Session, use_ai_agent: bool = False):
    """
    Core recruitment flow (runs in background):
    1. Call Claude to write a personalised message.
    2. Send email.
    3. Create an Interview record in the DB.
    """
    # 1. Create Interview record first to get the ID if using AI Agent
    try:
        try:
            dt = datetime.fromisoformat(interview_date)
        except ValueError:
            dt = datetime.now() + timedelta(days=1)

        db_interview = Interview(
            candidate_name=candidate.name,
            candidate_email=candidate.email,
            role=role,
            date=dt,
            interview_type=interview_type,
            interview_mean="ai_agent" if use_ai_agent else "google_meet",
            status="scheduled",
            meet_link=meet_link
        )
        db.add(db_interview)
        db.commit()
        db.refresh(db_interview)
        
        # If AI Agent, generate the specific portal link
        final_link = meet_link
        platform = "Google Meet (Video)"
        if use_ai_agent:
            # Assuming frontend runs on localhost:5173
            final_link = f"http://localhost:5173/portal/interview?interview_id={db_interview.id}"
            platform = "Nexus AI Recruitment Agent"
            db_interview.meet_link = final_link
            db.commit()

        # 2. Generate personalised message
        msg = generate_recruiter_message(
            candidate_name=candidate.name or "Candidate",
            role=role,
            skills=candidate.skills or [],
            experience=candidate.experience or [],
            summary=candidate.summary or "",
            interview_date=interview_date,
            meet_link=final_link,
        )
        
        # Override HTML body for platform
        from app.services.ai_recruiter_service import _build_html_email
        first_name = candidate.name.split()[0] if candidate.name else "Candidate"
        msg["html_body"] = _build_html_email(first_name, role, interview_date, final_link, platform=platform)

        # 3. Send email (only if we have a valid address)
        email_sent = False
        if candidate.email:
            email_sent = send_recruiter_email(
                to_email=candidate.email,
                subject=msg.get("subject", f"Interview Invitation – {role}"),
                plain_body=msg.get("plain_body", ""),
                html_body=msg.get("html_body", ""),
            )

    except Exception as e:
        print(f"[AI Recruiter] ⚠️ Recruitment failed: {e}")
        db.rollback()
        return

    status = "✅ Email sent" if email_sent else "⚠️ Email skipped (no address or SMTP error)"
    print(f"[AI Recruiter] {candidate.name} ({role}) – {status}")


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/recruit/{candidate_id}")
async def recruit_candidate(
    candidate_id: int,
    payload: RecruitRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Recruit a single candidate by ID.
    - Claude generates a personalised email.
    - Email is sent with the meet link.
    - An Interview row is created in the DB.
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    if not candidate.email:
        raise HTTPException(
            status_code=422,
            detail="Candidate has no email address on record. Please update their profile first.",
        )

    role          = candidate.applied_job or "Open Position"
    interview_date = payload.interview_date or _default_date()

    background_tasks.add_task(
        _do_recruit,
        candidate,
        role,
        payload.meet_link or "AI-GENERATED",
        interview_date,
        payload.interview_type,
        db,
        payload.use_ai_agent
    )

    return {
        "status": "queued",
        "message": f"🤖 AI Recruiter is reaching out to {candidate.name} ({candidate.email}) for the {role} role.",
        "candidate": {
            "id": candidate.id,
            "name": candidate.name,
            "email": candidate.email,
            "role": role,
        },
        "interview_date": interview_date,
        "meet_link": payload.meet_link,
    }


@router.post("/recruit-batch")
async def recruit_batch(
    payload: BatchRecruitRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Recruit all candidates whose applied_job matches job_name.
    Optionally override with explicit candidate_ids.
    """
    if payload.candidate_ids:
        candidates = db.query(Candidate).filter(Candidate.id.in_(payload.candidate_ids)).all()
    else:
        candidates = _match_candidates_by_job(payload.job_name, db)

    if not candidates:
        raise HTTPException(
            status_code=404,
            detail=f"No candidates found for '{payload.job_name}'.",
        )

    interview_date = payload.interview_date or _default_date()
    dispatched     = []

    for c in candidates:
        if not c.email:
            continue
        role = c.applied_job or payload.job_name
        background_tasks.add_task(
            _do_recruit, c, role, payload.meet_link or "AI-GENERATED", interview_date, payload.interview_type, db, payload.use_ai_agent
        )
        dispatched.append({"id": c.id, "name": c.name, "email": c.email, "role": role})

    if not dispatched:
        raise HTTPException(
            status_code=422,
            detail="Candidates found but none have email addresses on record.",
        )

    return {
        "status": "queued",
        "message": f"🤖 AI Recruiter is reaching out to {len(dispatched)} candidate(s) for '{payload.job_name}'.",
        "dispatched": dispatched,
        "interview_date": interview_date,
        "meet_link": payload.meet_link,
    }


@router.get("/preview/{candidate_id}")
async def preview_recruiter_message(
    candidate_id: int,
    meet_link: str = "https://meet.google.com/preview",
    interview_date: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Preview the AI-generated email for a candidate without sending it.
    Useful for HR to review before dispatching.
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    role           = candidate.applied_job or "Open Position"
    interview_date = interview_date or _default_date()

    msg = generate_recruiter_message(
        candidate_name=candidate.name or "Candidate",
        role=role,
        skills=candidate.skills or [],
        experience=candidate.experience or [],
        summary=candidate.summary or "",
        interview_date=interview_date,
        meet_link=meet_link,
    )

    return {
        "candidate_name": candidate.name,
        "candidate_email": candidate.email,
        "role": role,
        "subject": msg.get("subject"),
        "plain_body": msg.get("plain_body"),
        "html_preview": msg.get("html_body"),
    }
