
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", SMTP_USER)

def send_assessment_email(to_email: str, job_name: str, assessment_data: dict):
    """
    Sends an assessment invitation email.
    assessment_data should contain: id, title, description, duration, difficulty, focus
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"SMTP credentials missing. Would have sent email to {to_email} for {job_name}.")
        return False

    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = to_email
        msg['Subject'] = f"🚀 Evaluation: New Skill Assessment for {job_name}"

        # Build Email Body
        # Assuming frontend runs on localhost:5173
        portal_link = f"http://localhost:5173/portal/assessment-portal?assessment_id={assessment_data['id']}&email={to_email}"
        focus_str = ", ".join(assessment_data.get('focus', []))
        
        body = f"""
        Hello Candidate,

        You are invited to complete an AI-driven proficiency assessment for the position of {job_name}.

        Assessment Details:
        - Title: {assessment_data['title']}
        - Description: {assessment_data['description']}
        - Duration: {assessment_data['duration']}
        - Difficulty: {assessment_data['difficulty']}
        - Focus Areas: {focus_str}

        Please click the link below to initialize your evaluation environment:
        {portal_link}

        Good luck,
        The NexHire AI Pipeline
        """
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Email successfully sent to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {e}")
        return False

def send_interview_email(to_email: str, candidate_name: str, role: str, date: str, meet_link: str = None):
    """
    Sends an interview invitation email with the Google Meet link if available.
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"SMTP credentials missing. Would have sent interview email to {to_email}.")
        return False

    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = to_email
        msg['Subject'] = f"🗓️ Interview Scheduled: {role} at NEXUS"

        meet_section = f"\nGoogle Meet Link: {meet_link}\n" if meet_link else ""
        
        body = f"""
        Hello {candidate_name},

        We are pleased to invite you for an interview for the {role} position.

        Interview Details:
        - Date & Time: {date}
        {meet_section}
        
        We look forward to speaking with you!

        Best regards,
        The NexHire HR Team
        """
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Interview email successfully sent to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send interview email to {to_email}: {e}")
        return False
def send_status_email(to_email: str, candidate_name: str, status: str, job_title: str):
    """
    Sends a Hire or Rejection email.
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"SMTP credentials missing. Would have sent {status} email to {to_email}.")
        return False

    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = to_email
        
        if status.lower() == "hire":
            msg['Subject'] = f"🎊 Congratulations! Offer for {job_title} at NEXUS"
            body = f"""
            Hello {candidate_name},

            We are thrilled to offer you the position of {job_title} at NEXUS. 
            Our team was very impressed with your background and performance during the evaluation process.

            We look forward to having you join our team!

            Best regards,
            The NexHire HR Team
            """
        else:
            msg['Subject'] = f"Update regarding your application for {job_title}"
            body = f"""
            Hello {candidate_name},

            Thank you for your interest in the {job_title} position at NEXUS. 
            After careful review, we have decided to move forward with other candidates at this time.

            We appreciate the time you took to apply and wish you the best in your career.

            Sincerely,
            The NexHire HR Team
            """

        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"{status.capitalize()} email successfully sent to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send {status} email to {to_email}: {e}")
        return False
