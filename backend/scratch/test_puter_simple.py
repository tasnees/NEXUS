import os
import puter
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("PUTER_TOKEN")
print(f"Token present: {bool(token)}")

try:
    ai = puter.PuterAI(token=token)
    print("Sending chat request...")
    resp = ai.chat("Hello")
    print(f"Response: {resp}")
except Exception as e:
    print(f"Error: {e}")
