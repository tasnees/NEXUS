import os
import json
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import puter # type: ignore

load_dotenv()
PUTER_TOKEN = os.getenv("PUTER_TOKEN")
DATABASE_URL = os.getenv("DATABASE_URL")

def dynamic_repair():
    print(f"--- Global AI Re-Alignment (Force Dynamic Match) ---")
    if not DATABASE_URL or not PUTER_TOKEN:
        print("Error: DATABASE_URL or PUTER_TOKEN not found in .env")
        return
        
    engine = create_engine(DATABASE_URL)
    ai = puter.PuterAI(token=PUTER_TOKEN)
    
    try:
        with engine.connect() as conn:
            # 1. Get ALL Active Jobs
            job_res = conn.execute(text("SELECT title FROM jobs")).fetchall()
            all_job_titles = [r[0] for r in job_res]
            if not all_job_titles:
                print("⚠️ ERROR: No jobs found! Create jobs in the dashboard first.")
                return
            
            job_context = ", ".join(all_job_titles)
            print(f"Assigning candidates based on these jobs: {all_job_titles}\n")
            
            # 2. Re-Analyze ALL Candidates (Forcing update)
            cand_res = conn.execute(text("SELECT id, name, filename, experience, skills FROM candidates")).fetchall()
            
            for c in cand_res:
                print(f"Re-Analyzing CV for: {c.name}...")
                
                # Use CV experience/skills for matching context
                cv_summary = f"Filename: {c.filename} | Skills: {c.skills} | Experience: {c.experience}"
                
                prompt = f"""Identify the most suitable job title for this candidate based on their CV summary.
AVAILABLE JOBS:
{job_context}

CANDIDATE CV SUMMARY:
{cv_summary}

STRICT JSON OUTPUT (Pick EXACT title from list):
{{ "match": "exact_job_title_from_list" }}
"""
                try:
                    response = ai.chat(prompt, model="gpt-4o-mini")
                    raw_str = str(response).strip()
                    start_idx = raw_str.find("{")
                    end_idx = raw_str.rfind("}")
                    if start_idx != -1 and end_idx != -1:
                        data = json.loads(raw_str[start_idx : end_idx + 1])
                        best_match = data.get("match")
                        
                        # Apply selection to DB
                        if best_match and any(j.lower() == str(best_match).lower() for j in all_job_titles):
                            # Get the correct case version from the list
                            actual_title = next(j for j in all_job_titles if j.lower() == str(best_match).lower())
                            print(f"  ✅ AI Dynamic Match: {actual_title}")
                            conn.execute(
                                text("UPDATE candidates SET applied_job = :title WHERE id = :id"), 
                                {"title": actual_title, "id": c.id}
                            )
                        else:
                            # Fallback: pick the closest job
                            print(f"  ⚠️ AI GUESSED: '{best_match}' (Choosing nearest match from job list...)")
                            for j in all_job_titles:
                                if str(best_match).lower() in j.lower() or j.lower() in str(best_match).lower():
                                    conn.execute(
                                        text("UPDATE candidates SET applied_job = :title WHERE id = :id"), 
                                        {"title": j, "id": c.id}
                                    )
                                    break
                    conn.commit()
                except Exception as e:
                    print(f"  ❌ AI Error for {c.name}: {e}")

            print(f"\n✅ RE-ALIGNMENT COMPLETE.")
            print(f"Your talent pool is now perfectly and dynamically categorized!")

    except Exception as e:
        print(f"Dynamic re-alignment failed: {e}")

if __name__ == "__main__":
    dynamic_repair()
