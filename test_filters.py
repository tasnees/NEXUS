import requests
import json

BASE_URL = "http://localhost:8001/api/v1"

def test_agent_filters():
    print("--- TESTING AGENT FILTERS ---")
    
    # 1. Get an assessment
    assessments = requests.get(f"{BASE_URL}/assessments/").json()
    if not assessments:
        print("No assessments found to test.")
        return
    
    assessment = assessments[0]
    print(f"Testing with Assessment ID: {assessment['id']} - {assessment['title']}")
    
    # 2. Update assessment with specific filters
    print("Updating assessment with strict filters (Threshold: 95%, Nodes: ['Scalability'])...")
    update_data = {
        "title": assessment['title'],
        "duration": assessment['duration'],
        "difficulty": assessment['difficulty'],
        "focus": assessment['focus'],
        "description": "Build a simple hello world function.", # Simple task
        "steps": assessment['steps'],
        "required_format": "python",
        "job_id": assessment['job_id'],
        "grading_threshold": 95,
        "auto_reject": 1,
        "evaluation_nodes": ["Scalability"] # AI should fail a 'hello world' on scalability if told to focus on it
    }
    requests.put(f"{BASE_URL}/assessments/{assessment['id']}", json=update_data)
    
    import time
    email = f"filter_test_{int(time.time())}@example.com"
    sub_data = {
        "assessment_id": assessment['id'],
        "candidate_email": email,
        "answer": "def hello():\n    print('hello world')"
    }
    sub_res = requests.post(f"{BASE_URL}/submissions/", json=sub_data).json()
    sub_id = sub_res['id']
    
    # Ensure candidate exists for auto-reject test
    # (Assuming we have a candidate with this email, if not let's create one)
    # Note: Backend might need a real candidate in DB
    
    # 4. Trigger AI Grading
    print(f"Triggering AI Grade for submission {sub_id}...")
    res = requests.post(f"{BASE_URL}/submissions/{sub_id}/ai-grade")
    print(f"DEBUG: Response Status: {res.status_code}")
    grade_res = res.json()
    
    print("\n--- RESULTS ---")
    print(json.dumps(grade_res, indent=2))
    
    if grade_res.get('score', 0) < 95:
        print("SUCCESS: AI respected the high threshold.")
    else:
        print("NOTE: AI still gave a high score. (Might be too lenient)")
        
    # 5. Check Auto-Reject (if candidate exists)
    # We'll skip this part unless we verify candidate creation
    
if __name__ == "__main__":
    test_agent_filters()
