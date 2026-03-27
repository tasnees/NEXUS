import puter
import sys

def scan_puter():
    print(f"--- Puter SDK Version Diagnostic ---")
    print(f"Puter Version: {getattr(puter, '__version__', 'Unknown')}")
    
    print("\nRoot attributes:")
    print([attr for attr in dir(puter) if not attr.startswith("_")])
    
    if hasattr(puter, "ai"):
        print("\n'ai' module attributes:")
        print([attr for attr in dir(puter.ai) if not attr.startswith("_")])
        
        # Test common methods
        for method in ["chat", "complete", "chat_complete", "text_complete"]:
            if hasattr(puter.ai, method):
                print(f"✅ Found puter.ai.{method}")

if __name__ == "__main__":
    scan_puter()
