import os
import puter
import json
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional

load_dotenv()

class AIEngine:
    @staticmethod
    def _get_client():
        token = os.getenv("PUTER_TOKEN")
        if not token:
            print("Warning: PUTER_TOKEN is not set.")
            return None
        try:
            return puter.PuterAI(token=token)
        except Exception as e:
            print(f"Error initializing PuterAI: {e}")
            return None

    @staticmethod
    async def chat(prompt: str, system_prompt: Optional[str] = None, model: str = "gpt-4o-mini") -> str:
        """
        Generic chat completion using Puter AI.
        """
        client = AIEngine._get_client()
        if not client:
            return ""

        try:
            full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
            # Puter SDK returns a string or an object with text attribute
            response = client.chat(full_prompt, model=model)
            
            if response and isinstance(response, str):
                return response
            elif hasattr(response, 'text'):
                return response.text
            return str(response)
        except Exception as e:
            print(f"AIEngine.chat error: {e}")
            return ""

    @staticmethod
    async def generate_json(prompt: str, system_prompt: Optional[str] = None, model: str = "gpt-4o-mini") -> Dict[str, Any]:
        """
        Generates a JSON response using Puter AI and parses it.
        """
        json_prompt = prompt + "\n\nReturn ONLY a valid JSON object. No preamble, no markdown fences."
        response_text = await AIEngine.chat(json_prompt, system_prompt, model)
        
        if not response_text:
            return {}

        try:
            # Clean response text
            content = response_text.strip()
            if "```json" in content:
                content = content.split("```json")[-1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[-1].split("```")[0].strip()
            
            # Find the first { and last }
            start = content.find("{")
            end = content.rfind("}")
            if start != -1 and end != -1:
                content = content[start:end+1]
            
            return json.loads(content)
        except Exception as e:
            print(f"AIEngine.generate_json parse error: {e}")
            print(f"Raw content: {response_text}")
            return {}
