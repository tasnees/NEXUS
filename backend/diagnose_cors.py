import sys
from pathlib import Path

# Add app to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

try:
    print("Attempting to import app.main...")
    from app.main import app
    print("Successfully imported FastAPI app.")
    
    # Check middleware
    cors_middleware = [m for m in app.user_middleware if "CORSMiddleware" in str(m.cls)]
    if cors_middleware:
        print("CORSMiddleware is present.")
        # Try to inspect origins (depends on how it's stored in the middleware object)
        # For FastAPI/Starlette, it's usually in middleware.options
        for m in cors_middleware:
            print(f"Origins: {m.options.get('allow_origins')}")
    else:
        print("CORSMiddleware is MISSING!")
        
except Exception as e:
    print(f"FAILED to start backend: {e}")
    import traceback
    traceback.print_exc()
