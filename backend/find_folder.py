import sys
from pathlib import Path

# Setup paths
backend_dir = Path(r"c:\Users\21625\Desktop\AI_hiring_manager\backend")
sys.path.insert(0, str(backend_dir))

from drive_sync_orchestrator import _build_drive_service

def list_all_folders():
    try:
        service = _build_drive_service()
        
        # Search for all folders
        query = "mimeType='application/vnd.google-apps.folder' and trashed=false"
        results = service.files().list(q=query, fields="files(id, name)", pageSize=50).execute()
        files = results.get("files", [])
        
        if not files:
            print("No folders found at all.")
        else:
            print("Found folders:")
            for f in files:
                print(f"- Name: '{f['name']}', ID: '{f['id']}'")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_all_folders()
