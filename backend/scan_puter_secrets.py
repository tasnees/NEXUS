import puter
import sys
import inspect

def scan_secrets():
    print(f"--- Puter SDK Secret Scouter ---")
    
    # 1. Scan AUTH
    if hasattr(puter, "auth"):
        print("\n'auth' module attributes:")
        attrs = [attr for attr in dir(puter.auth) if not attr.startswith("_")]
        print(attrs)

    # 2. Look at PuterAI constructor
    ai_cls = None
    if hasattr(puter, "PuterAI"):
        ai_cls = puter.PuterAI
    elif hasattr(puter, "ai") and hasattr(puter.ai, "PuterAI"):
        ai_cls = puter.ai.PuterAI
        
    if ai_cls:
        print("\n'PuterAI' Constructor:")
        try:
            sig = inspect.signature(ai_cls.__init__)
            print(sig)
        except:
            print("Could not inspect signature.")

    # 3. Scan AI
    if hasattr(puter, "ai"):
        print("\n'ai' module attributes:")
        print([attr for attr in dir(puter.ai) if not attr.startswith("_")])

if __name__ == "__main__":
    scan_secrets()
