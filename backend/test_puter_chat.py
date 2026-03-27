import os
import sys
from dotenv import load_dotenv
import puter

load_dotenv()

def test_chat():
    token = os.getenv("PUTER_TOKEN")
    print(f"--- Puter AI Connection Test (Constructor token={bool(token)}) ---")
    
    try:
        # Step 3: Initialization using the found constructor signature
        ai = None
        if hasattr(puter, "PuterAI"):
            ai = puter.PuterAI(token=token)
        elif hasattr(puter, "ai") and hasattr(puter.ai, "PuterAI"):
            ai = puter.ai.PuterAI(token=token)
        else:
            ai = puter.ai
            
        print("Brain initialized. Sending 'Hello'...")
        
        # Test with various common models
        for model in ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"]:
            print(f"Trying model: {model}...")
            try:
                # Some Puter versions might use ai.chat(), others ai.complete()
                response = None
                if hasattr(ai, "chat"):
                    response = ai.chat("Hello, are you there?", model=model)
                elif hasattr(ai, "complete"):
                    response = ai.complete("Hello, are you there?", model=model)
                
                if response:
                    print(f"✅ SUCCESS with {model}!")
                    print(f"Response: {response}")
                    return
                else:
                    print(f"❌ Method not found in {model}")
            except Exception as e:
                print(f"❌ Failed with {model}: {e}")

        # Final resort: without model
        try:
            print("Trying without specifying a model...")
            response = ai.chat("Hello?") if hasattr(ai, "chat") else ai.complete("Hello?")
            print(f"✅ SUCCESS without model!")
            print(f"Response: {response}")
        except Exception as e:
            print(f"❌ Final failure: {e}")

    except Exception as e:
        print(f"Initialization failed: {e}")

if __name__ == "__main__":
    test_chat()
