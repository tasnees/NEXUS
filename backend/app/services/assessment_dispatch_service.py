
import logging
from sqlalchemy.orm import Session
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.assessment import Assessment
from app.services.screening_service import calculate_screening_score
from app.services.email_service import send_assessment_email

log = logging.getLogger("AssessmentDispatch")

def check_and_dispatch_assessment(db: Session, candidate_id: int):
    """
    Calculates the screening score for a candidate and sends an assessment 
    if the score is 70% or higher.
    """
    try:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            log.warning(f"Candidate {candidate_id} not found for assessment dispatch.")
            return

        if not candidate.applied_job or candidate.applied_job == "Uncategorized":
            log.info(f"Candidate {candidate.name} has no assigned job. Skipping assessment.")
            return

        job = db.query(Job).filter(Job.title == candidate.applied_job).first()
        
        # Calculate Step 1: Resume Screening Score
        scores = calculate_screening_score(candidate, job)
        overall_score = scores["overall"]
        log.info(f"📊 Candidate {candidate.name} Step 1 Score: {overall_score}%")

        if overall_score >= 70:
            log.info(f"🚀 Score >= 70%! Attempting to send assessment for '{candidate.applied_job}'...")
            
            # Find an assessment for this job
            assessment = None
            if job:
                assessment = db.query(Assessment).filter(Assessment.job_id == job.id).first()
            
            if not assessment:
                # Fallback: search by title match
                assessment = db.query(Assessment).join(Job).filter(Job.title == candidate.applied_job).first()
                
            if assessment and candidate.email:
                assessment_data = {
                    "id": assessment.id,
                    "title": assessment.title,
                    "description": assessment.description,
                    "duration": assessment.duration,
                    "difficulty": assessment.difficulty,
                    "focus": assessment.focus or []
                }
                success = send_assessment_email(candidate.email, candidate.applied_job, assessment_data)
                if success:
                    log.info(f"📧 Assessment invitation sent to {candidate.email}")
                    return True
                else:
                    log.warning(f"⚠️ Failed to send assessment email to {candidate.email}")
            else:
                if not assessment:
                    log.warning(f"⚠️ No assessment found for job '{candidate.applied_job}'.")
                if not candidate.email:
                    log.warning(f"⚠️ Candidate has no email.")
        else:
            log.info(f"⏳ Score {overall_score}% < 70%. No assessment sent.")
            
    except Exception as e:
        log.error(f"❌ Error during check_and_dispatch_assessment: {e}")
    
    return False
