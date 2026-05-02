from fastapi import APIRouter
from app.utils.job_enrichment import enrich_job_details

router = APIRouter()

@router.get("/enrich", response_model=dict)
async def get_enrichment_preview(title: str):
    """
    Returns AI-generated job details (description, salary, tags, requirements) 
    based on a title, without saving to the database.
    """
    return await enrich_job_details(title)
