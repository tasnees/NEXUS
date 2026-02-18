
import os
import sys
import tempfile
import argparse
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.config.database import SessionLocal
from app.models.job import Job
from app.models.gmail_attachement_extractor import authenticate, search_emails, get_attachments, download_attachment
from app.services.pdf_extractor import PDFExtractor

def get_jobs(db: Session) -> List[Job]:
    """Retrieves all active jobs from the database."""
    return db.query(Job).all()

def classify_application(resume_text: str, jobs: List[Job]) -> Optional[Job]:
    """
    Classifies the application based on resume text and job descriptions.
    Uses simple keyword matching for demonstration.
    For production, consider using an LLM or more sophisticated NLP.
    """
    best_job = None
    max_score = 0
    resume_text_lower = resume_text.lower()

    for job in jobs:
        score = 0
        if job.title and job.title.lower() in resume_text_lower:
            score += 10  # High weight for job title match
        
        if job.tags:
             # Handle tags based on whether it's a list or string (JSON column might return list)
            tags_list = job.tags if isinstance(job.tags, list) else []
            for tag in tags_list:
                if tag.lower() in resume_text_lower:
                    score += 2 # Weight for tag match
        
        # You could also match against job description if available

        if score > max_score:
            max_score = score
            best_job = job
    
    # Threshold for classification (optional)
    if max_score > 0:
        return best_job
    return None

def main():
    parser = argparse.ArgumentParser(description="Classify Gmail applications based on job descriptions.")
    parser.add_argument("--subject", default="Application", help="Subject line to filter emails (default: 'Application')")
    parser.add_argument("--limit", type=int, default=10, help="Max emails to process")
    args = parser.parse_args()

    print("Authenticating with Gmail...")
    try:
        gmail_service, _ = authenticate() # We don't need drive_service for this script
    except Exception as e:
        print(f"Authentication failed: {e}")
        return

    print("Connecting to database...")
    db = SessionLocal()
    try:
        jobs = get_jobs(db)
        if not jobs:
            print("No jobs found in the database. Please add jobs first.")
            return
        
        print(f"Found {len(jobs)} active jobs.")

        print(f"Searching for emails with subject '{args.subject}'...")
        messages = search_emails(gmail_service, args.subject)
        
        if not messages:
            print("No emails found.")
            return

        print(f"Processing up to {args.limit} emails...")
        processed_count = 0
        
        for message in messages[:args.limit]:
            msg_id = message['id']
            attachments, msg_data = get_attachments(gmail_service, msg_id)
            
            # Get sender/subject for logging
            headers = msg_data['payload']['headers']
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
            sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown Sender')

            print(f"\n--- Processing Email: {subject} from {sender} ---")

            if not attachments:
                print("No attachments found.")
                continue

            pdf_attachments = [att for att in attachments if att['mimeType'] == 'application/pdf']
            
            if not pdf_attachments:
                print("No PDF attachments found.")
                continue

            for attachment in pdf_attachments:
                print(f"  Downloading resume: {attachment['filename']}...")
                file_data = download_attachment(gmail_service, msg_id, attachment['attachmentId'])
                
                if file_data:
                    # Create a temporary file to process with PDFExtractor
                    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
                        temp_pdf.write(file_data)
                        temp_pdf_path = temp_pdf.name
                    
                    try:
                        extractor = PDFExtractor(file_path=temp_pdf_path)
                        text = extractor.extract_text()
                        
                        if text:
                            matched_job = classify_application(text, jobs)
                            if matched_job:
                                print(f"  ✅ CLASSIFIED: {matched_job.title} (ID: {matched_job.id})")
                                # Here you could update a DB record, move the email, send a reply, etc.
                            else:
                                print("  ⚠️  Unclassified: No strong match found.")
                        else:
                            print("  ⚠️  Could not extract text from PDF.")
                            
                    except Exception as e:
                        print(f"  ❌ Error processing PDF: {e}")
                    finally:
                        if os.path.exists(temp_pdf_path):
                            os.remove(temp_pdf_path)
                else:
                    print("  ❌ Failed to download attachment.")
            
            processed_count += 1
            
        print(f"\nDone. Processed {processed_count} emails.")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
