import requests
import sys

try:
    r = requests.get("http://localhost:8001/", timeout=5)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.json()}")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
