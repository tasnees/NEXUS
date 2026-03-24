import os
import json
import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))

# Fallback templates if AI fails/key is missing
DEFAULT_TEMPLATES = {
    "software engineer": {
        "description": "Building high-performance, scalable software solutions. You will collaborate with cross-functional teams to design, develop, and maintain codebases.",
        "requirements": "Proficiency in one or more modern programming languages. Experience with cloud infrastructure and CI/CD pipelines. Strong problem-solving skills.",
        "salary": "$90k - $140k",
        "tags": ["Full-Stack", "FastAPI", "Python"]
    },
    "default": {
        "description": "A leadership role focused on driving impact and delivering high-quality results for our growing team.",
        "requirements": "Proven track record in a similar role. Strong communication and leadership skills. Relevant degree or certification.",
        "salary": "Competitive",
        "tags": ["AI-First", "High Growth"]
    }
}

async def enrich_job_details(title: str, existing_description: str = "", existing_requirements: str = ""):
    """
    Uses Anthropic Claude to fill in missing job posting details based on title.
    """
    api_key = os.getenv("ANTHROPIC_API_KEY")
    
    # If key is placeholder or missing, use local templates
    if not api_key or "YOUR_ANTHROPIC" in api_key:
        print("--- Falling back to local templates for Job Enrichment ---")
        low_title = title.lower()
        template = DEFAULT_TEMPLATES.get("software engineer" if "software" in low_title or "frontend" in low_title or "backend" in low_title else "default")
        return template

    try:
        prompt = f"""
        You are a professional hiring manager. 
        Create a high-quality, professional job posting details for the title: "{title}".
        Provide the response as a valid JSON object with the following keys:
        - "description": (3-4 sentences of job overview)
        - "requirements": (3-5 bullet points as a single string, separated by newlines)
        - "salary": (Estimated market range, eg. $100k-$150k)
        - "tags": (A list of 3-5 technical skills or keywords)

        Do not include any preamble or text outside the JSON block.
        """
        
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        content = response.content[0].text
        # Extract JSON (in case Claude adds markdown ```json)
        if "```json" in content:
            content = content.split("```json")[-1].split("```")[0].strip()
        elif "{" in content:
            content = content[content.find("{"):content.rfind("}")+1]
            
        data = json.loads(content)
        return data
        
    except Exception as e:
        print(f"Error enriching job with AI: {e}")
        return DEFAULT_TEMPLATES["default"]
