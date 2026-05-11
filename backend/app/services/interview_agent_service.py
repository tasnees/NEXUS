import os
import json
import anthropic
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional

load_dotenv()

def get_anthropic_client():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key or api_key == "YOUR_ANTHROPIC_API_KEY":
        return None
    return anthropic.Anthropic(api_key=api_key)

class InterviewAgentService:
    @staticmethod
    async def get_next_response(
        candidate_name: str,
        role: str,
        transcript: List[Dict[str, str]],
        job_description: Optional[str] = None,
        candidate_summary: Optional[str] = None
    ) -> str:
        """
        Generates the next response from the AI recruitment agent.
        """
        system_prompt = f"""
You are "Nexus", a highly professional and empathetic AI Recruitment Agent for the company "HireSync".
Your goal is to conduct a screening interview with {candidate_name} for the position of {role}.

CONTEXT:
- Role: {role}
- Job Details: {job_description or "A high-impact role at HireSync."}
- Candidate Background: {candidate_summary or "An applicant with relevant skills for the role."}

GUIDELINES:
1. Be professional, warm, and engaging.
2. Ask one question at a time.
3. Start by introducing yourself and welcoming the candidate if the transcript is empty.
4. Dive into their experience, specific skills relevant to the role, and their motivation.
5. If they give short answers, ask follow-up questions to dig deeper.
6. If the interview has gone on for about 10-15 exchanges, thank them and let them know the team will be in touch.
7. Avoid being repetitive.
8. Maintain the persona of a human-like recruitment professional.

Your response should be just the text of what you would say to the candidate.
"""
        
        messages = []
        for turn in transcript:
            role_map = {"agent": "assistant", "candidate": "user"}
            messages.append({"role": role_map.get(turn["role"], "user"), "content": turn["content"]})

        client = get_anthropic_client()
        if not client:
            try:
                # Use Puter as fallback if token exists
                if os.getenv("PUTER_TOKEN"):
                    import puter
                    puter.set_auth_token(os.getenv("PUTER_TOKEN"))
                    full_prompt = f"{system_prompt}\n\nTRANSCRIPT:\n" + "\n".join([f"{m['role']}: {m['content']}" for m in messages])
                    response = puter.ai.chat(full_prompt)
                    return response
            except Exception as pe:
                print(f"Puter fallback failed: {pe}")

            print("Warning: ANTHROPIC_API_KEY is missing. Using static fallback.")
            if not transcript:
                return f"Hello {candidate_name}, I'm Nexus from HireSync. I'll be conducting your initial screening for the {role} position today. To start, could you tell me a bit about your background and what interests you about this role?"
            return "Thank you for sharing that. Can you tell me more about your experience with relevant technologies?"

        try:
            response = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=1000,
                system=system_prompt,
                messages=messages if messages else [{"role": "user", "content": "Hello, I am ready to start the interview."}]
            )
            
            # If it was the first call with dummy user message, we might want to strip that context or just return the response
            return response.content[0].text
        except Exception as e:
            print(f"Error in InterviewAgentService: {e}")
            if not transcript:
                return f"Hello {candidate_name}, I'm Nexus from HireSync. I'll be conducting your initial screening for the {role} position today. To start, could you tell me a bit about your background and what interests you about this role?"
            return "I'm sorry, I'm having a bit of trouble connecting. Could you please repeat your last point?"

    @staticmethod
    async def evaluate_interview(transcript: List[Dict[str, str]], role: str) -> Dict[str, Any]:
        """
        Evaluates the interview transcript once it's completed.
        """
        prompt = f"""
You are a senior recruitment manager. Review the following interview transcript for the {role} position and provide a structured evaluation.

TRANSCRIPT:
{json.dumps(transcript, indent=2)}

Provide a JSON object with:
- "overall_score": (1-100)
- "summary": (2-3 sentences)
- "strengths": (list of strings)
- "weaknesses": (list of strings)
- "recommendation": ("Hire", "Consider", "Reject")
- "technical_proficiency": (1-10)
- "communication_skills": (1-10)

Do not include any preamble.
"""
        client = get_anthropic_client()
        if not client:
            return {
                "overall_score": 0,
                "summary": "Evaluation skipped: ANTHROPIC_API_KEY not configured.",
                "recommendation": "Manual Review Required"
            }

        try:
            response = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            content = response.content[0].text
            if "```json" in content:
                content = content.split("```json")[-1].split("```")[0].strip()
            elif "{" in content:
                content = content[content.find("{"):content.rfind("}")+1]
                
            return json.loads(content)
        except Exception as e:
            print(f"Error evaluating interview: {e}")
            return {
                "overall_score": 0,
                "summary": "Evaluation failed due to system error.",
                "recommendation": "Manual Review Required"
            }
