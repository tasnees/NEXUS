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
            # Step 2: Initialize Puter AI Brain
            ai_instance = None
            if hasattr(puter, "PuterAI"):
                try:
                    ai_instance = puter.PuterAI(api_key=token)
                except TypeError:
                    try:
                        ai_instance = puter.PuterAI(token=token)
                    except TypeError:
                        ai_instance = puter.PuterAI()
                        if token:
                            try:
                                ai_instance.token = token
                            except:
                                pass
            elif hasattr(puter, "ai") and hasattr(puter.ai, "PuterAI"):
                try:
                    ai_instance = puter.ai.PuterAI(api_key=token)
                except TypeError:
                    ai_instance = puter.ai.PuterAI()
            elif hasattr(puter, "ai"):
                ai_instance = puter.ai
            
            return ai_instance
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

        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        
        response = None
        # Robust method discovery
        for method_name in ["chat", "create_completion", "complete", "chat_complete"]:
            if hasattr(client, method_name):
                try:
                    method = getattr(client, method_name)
                    # Try with model first
                    try:
                        response = method(full_prompt, model=model)
                    except:
                        # Try without model
                        response = method(full_prompt)
                    
                    if response:
                        break
                except Exception as e:
                    print(f"AIEngine debug: method {method_name} failed: {e}")
                    continue

        if not response:
            print("AIEngine.chat error: All Puter AI methods failed.")
            return ""

        try:
            if isinstance(response, str):
                return response
            elif hasattr(response, 'text'):
                return response.text
            elif isinstance(response, dict) and 'text' in response:
                return response['text']
            return str(response)
        except Exception as e:
            print(f"AIEngine.chat parse error: {e}")
            return str(response)

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
