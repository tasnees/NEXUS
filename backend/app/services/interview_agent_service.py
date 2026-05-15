import os
import json
import puter
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional

load_dotenv()

import requests

def get_puter_client():
    # We return the token itself now, as we'll use requests directly
    return os.getenv("PUTER_TOKEN")

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
        num_turns = len([t for t in transcript if t["role"] == "candidate"])
        end_instruction = "CRITICAL: The interview has gone on long enough. Do NOT ask any more questions. Thank the candidate and say goodbye." if num_turns >= 6 else "If the interview has gone on for about 6-8 exchanges, thank them and wrap up."

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
5. {end_instruction}
6. Avoid being repetitive.
7. Maintain the persona of a human-like recruitment professional.

Your response should be just the text of what you would say to the candidate.
"""
        
        messages = []
        for turn in transcript:
            role_map = {"agent": "assistant", "candidate": "user"}
            messages.append({"role": role_map.get(turn["role"], "user"), "content": turn["content"]})

        token = get_puter_client()
        
        if token:
            try:
                # Build history string for context
                history_str = "\n".join([f"{t['role'].upper()}: {t['content']}" for t in transcript])
                full_prompt = f"{system_prompt}\n\nINTERVIEW HISTORY:\n{history_str}\n\nAGENT:"
                
                # Call Puter OpenAI-compatible endpoint
                url = "https://api.puter.com/puterai/openai/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "user", "content": full_prompt}]
                }
                
                response = requests.post(url, headers=headers, json=payload, timeout=30)
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    if isinstance(content, str):
                        return content.strip()
                    elif isinstance(content, list):
                        return "".join([block.get("text", "") if isinstance(block, dict) else str(block) for block in content]).strip()
                else:
                    print(f"Puter API error ({response.status_code}): {response.text}")
            except Exception as e:
                print(f"Puter AI generation failed: {e}")

        # --- Fallback Logic ---
        # If Puter fails or is not configured, use a more dynamic scripted approach
        candidate_turns = [t for t in transcript if t["role"] == "candidate"]
        num_turns = len(candidate_turns)

        if num_turns == 0:
            return f"Hello {candidate_name}, I'm Nexus from HireSync. I'll be conducting your initial screening for the {role} position today. To start, could you tell me a bit about your background and what interests you about this role?"
        
        # Scripted responses as a last resort
        responses = [
            "Thank you for sharing that. Can you tell me more about your experience with technologies relevant to this role?",
            "That's very helpful. Could you describe a challenging project you've worked on recently and your specific contribution?",
            "I see. How do you typically approach learning new tools or frameworks when a project requires them?",
            "Great. In terms of collaboration, how do you handle feedback or differing opinions within a team?",
            "Thank you. What are you looking for in your next role, and what motivates you to join HireSync specifically?"
        ]

        if num_turns <= len(responses):
            return responses[num_turns - 1]
        
        return "Thank you for your time today! I've gathered all the initial information we need. Our recruitment team will review your profile and get back to you within 3-5 business days."

    @staticmethod
    async def evaluate_interview(transcript: List[Dict[str, str]], role: str) -> Dict[str, Any]:
        """
        Evaluates the interview transcript once it's completed.
        """
        # Truncate transcript and message content if they're too long
        eval_transcript = []
        source_transcript = transcript[-15:] if len(transcript) > 15 else transcript
        for t in source_transcript:
            eval_transcript.append({
                "role": t["role"],
                "content": (t["content"][:500] + "...") if len(t["content"]) > 500 else t["content"]
            })
        
        prompt = f"""
You are a senior recruitment manager. Review the following interview transcript for the {role} position and provide a structured evaluation.

TRANSCRIPT:
{json.dumps(eval_transcript, indent=2)}

Provide a JSON object with:
- "overall_score": (1-100)
- "summary": (2-3 sentences)
- "strengths": (list of strings)
- "weaknesses": (list of strings)
- "recommendation": ("Hire", "Consider", "Reject")
- "technical_proficiency": (1-10)
- "communication_skills": (1-10)

Do not include any preamble or markdown formatting, just the raw JSON.
"""
        token = get_puter_client()
        if not token:
            return {
                "overall_score": 0,
                "summary": "Evaluation skipped: PUTER_TOKEN not configured.",
                "recommendation": "Manual Review Required"
            }

        try:
            url = "https://api.puter.com/puterai/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}]
            }
            
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            if response.status_code != 200:
                raise Exception(f"Puter API error ({response.status_code}): {response.text}")
                
            raw_content = response.json()["choices"][0]["message"]["content"]
            content = ""
            
            if isinstance(raw_content, str):
                content = raw_content
            elif isinstance(raw_content, list):
                content = "".join([block.get("text", "") if isinstance(block, dict) else str(block) for block in raw_content])
            
            # Find the first { and last } to ensure we have a valid JSON object
            start_idx = content.find("{")
            end_idx = content.rfind("}")
            if start_idx != -1 and end_idx != -1:
                content = content[start_idx:end_idx + 1]
            else:
                raise Exception(f"No JSON object found in AI response: {content[:100]}...")
                
            return json.loads(content)
        except Exception as e:
            print(f"Error evaluating interview: {e}")
            return {
                "overall_score": 0,
                "summary": f"Evaluation failed: {str(e)}",
                "recommendation": "Manual Review Required"
            }
