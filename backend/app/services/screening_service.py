
import re
from typing import List, Dict, Any, Optional
from app.models.candidate import Candidate
from app.models.job import Job

def extract_job_dimensions(job: Optional[Job]) -> List[str]:
    """
    Replicates the frontend's extractJobDimensions logic.
    """
    if not job:
        return ['Problem Solving', 'Code Efficiency', 'System Architecture']
    
    dimensions = []
    
    # 1. From tags
    if job.tags and isinstance(job.tags, list):
        tags = [t.strip() for t in job.tags if t and t.strip()]
        dimensions.extend(tags[:3])
    
    # 2. From requirements if we need more
    if len(dimensions) < 3 and job.requirements:
        # Split by newline, comma, or semicolon
        lines = re.split(r'[\n,;]+', job.requirements)
        for line in lines:
            clean_line = line.strip()
            if 3 < len(clean_line) < 40 and clean_line not in dimensions:
                dimensions.append(clean_line)
                if len(dimensions) >= 3:
                    break
    
    # 3. Defaults
    defaults = ['Domain Knowledge', 'Technical Depth', 'Communication']
    while len(dimensions) < 3:
        dimensions.append(defaults[len(dimensions)])
        
    return dimensions[:3]

def score_dimension(label: str, candidate: Candidate) -> float:
    """
    Replicates the frontend's scoreDimension logic.
    """
    skills_text = " ".join(candidate.skills) if isinstance(candidate.skills, list) else ""
    text = (candidate.raw_text or "" + skills_text).lower()
    
    words = label.lower().split()
    hits = 0
    for word in words:
        if len(word) > 2 and word in text:
            hits += 1
            
    base_from_skills = min(70, (len(candidate.skills or []) * 3))
    base_from_exp = min(15, (len(candidate.experience or []) * 3))
    keyword_bonus = min(15, hits * 5)
    
    score = 55 + (base_from_skills * 0.15) + base_from_exp + keyword_bonus
    return min(97, score)

def calculate_screening_score(candidate: Candidate, job: Optional[Job]) -> Dict[str, Any]:
    """
    Calculates the overall 'Step 1: Resume Screening' score.
    """
    dimensions = extract_job_dimensions(job)
    bars = []
    total_score = 0
    
    for dim in dimensions:
        score = round(score_dimension(dim, candidate))
        bars.append({"label": dim, "score": score})
        total_score += score
        
    overall = round(total_score / len(dimensions)) if dimensions else 0
    
    return {
        "overall": overall,
        "bars": bars
    }
