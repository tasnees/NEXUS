"""
AI Recruiter Service
--------------------
Uses Anthropic Claude to generate personalized, role-specific recruitment
outreach messages for each candidate, then dispatches a premium HTML email
containing the interview meet link.
"""

import os
import json
import smtplib
import anthropic
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

SMTP_SERVER   = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER     = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SENDER_EMAIL  = os.getenv("SENDER_EMAIL", SMTP_USER)

_claude = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))


# ──────────────────────────────────────────────────────────────────────────────
# AI Message Generation
# ──────────────────────────────────────────────────────────────────────────────

def generate_recruiter_message(
    candidate_name: str,
    role: str,
    skills: list,
    experience: list,
    summary: str,
    interview_date: str,
    meet_link: str,
) -> dict:
    """
    Ask Claude to act as an AI recruiter and draft a personalised interview
    invitation.  Returns a dict with keys: subject, plain_body, html_body.
    Falls back to a professional template if the API key is absent / the call
    fails.
    """
    skills_str     = ", ".join(skills[:8]) if skills else "various technical skills"
    experience_str = " | ".join(experience[:2]) if experience else "relevant industry experience"

    prompt = f"""
You are NEXUS, an elite AI recruitment agent at HireSync.
Your job is to write a warm, professional, highly-personalised interview
invitation email to a candidate.

Candidate profile:
- Name: {candidate_name}
- Applied role: {role}
- Key skills: {skills_str}
- Recent experience: {experience_str}
- Summary: {summary or 'Not provided'}

Interview logistics:
- Date & Time: {interview_date}
- Google Meet link: {meet_link}

Write a concise, enthusiastic email that:
1. Addresses the candidate by first name.
2. References 1-2 specific skills or experiences to show you read their CV.
3. Clearly states the date/time and meet link.
4. Ends with a warm sign-off from "The NEXUS Talent Team".

Return ONLY a valid JSON object with exactly these three keys:
{{
  "subject": "<email subject line>",
  "plain_body": "<plain-text version of the email>",
  "html_body": "<full HTML email body (no <html>/<head> wrapper, just the <body> inner content)>"
}}
The html_body should look premium: dark gradient header (#1E1B4B → #4F46E5),
white card body, a prominent CTA button for the Meet link, clean typography.
"""

    try:
        api_key = os.getenv("ANTHROPIC_API_KEY", "")
        if not api_key or "YOUR_ANTHROPIC" in api_key:
            raise ValueError("No valid API key")

        response = _claude.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        )
        content = response.content[0].text
        # Strip markdown fences if present
        if "```json" in content:
            content = content.split("```json")[-1].split("```")[0].strip()
        elif "{" in content:
            content = content[content.find("{"):content.rfind("}") + 1]
        return json.loads(content)

    except Exception as e:
        print(f"[AI Recruiter] Claude call failed ({e}), using fallback template.")
        return _fallback_message(candidate_name, role, interview_date, meet_link)


def _fallback_message(
    candidate_name: str,
    role: str,
    interview_date: str,
    meet_link: str,
) -> dict:
    """Professional fallback when Claude is unavailable."""
    first_name = candidate_name.split()[0] if candidate_name else "Candidate"
    subject = f"🎯 Interview Invitation – {role} | NEXUS HireSync"
    plain_body = f"""Hi {first_name},

We're excited to move you forward in our recruitment process for the {role} position!

Your experience impressed our team and we'd love to learn more about you.

Interview Details
-----------------
Date & Time : {interview_date}
Platform    : Google Meet
Link        : {meet_link}

Please join a few minutes early so we can get started on time.
If you need to reschedule, simply reply to this email.

We look forward to speaking with you!

Best regards,
The NEXUS Talent Team
HireSync AI Platform
"""
    html_body = _build_html_email(first_name, role, interview_date, meet_link)
    return {"subject": subject, "plain_body": plain_body, "html_body": html_body}


def _build_html_email(
    first_name: str,
    role: str,
    interview_date: str,
    meet_link: str,
    platform: str = "Google Meet (Video)"
) -> str:
    """Render a premium HTML email template."""
    return f"""
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:620px;margin:0 auto;background:#F8FAFC;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(79,70,229,0.12)">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1E1B4B 0%,#4F46E5 60%,#7C3AED 100%);padding:40px 32px;text-align:center">
    <p style="color:rgba(255,255,255,0.6);font-size:12px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 12px">NEXUS · HireSync AI</p>
    <h1 style="color:#fff;font-size:28px;font-weight:800;margin:0 0 8px;line-height:1.2">You're Moving Forward! 🚀</h1>
    <p style="color:rgba(255,255,255,0.75);font-size:16px;margin:0">{role}</p>
  </div>

  <!-- Body Card -->
  <div style="background:#fff;padding:40px 32px">
    <p style="color:#334155;font-size:16px;margin:0 0 24px">Hi <strong>{first_name}</strong>,</p>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 32px">
      Congratulations — your profile stood out and we're excited to invite you for an interview for the
      <strong style="color:#4F46E5">{role}</strong> position. Our team was impressed with your background
      and we can't wait to learn more about you.
    </p>

    <!-- Details Card -->
    <div style="background:#F1F5F9;border-left:4px solid #4F46E5;border-radius:12px;padding:24px 28px;margin:0 0 32px">
      <p style="font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px">Interview Details</p>
      <table style="border-collapse:collapse;width:100%">
        <tr>
          <td style="color:#64748B;font-size:13px;padding:6px 0;width:120px">📅 Date &amp; Time</td>
          <td style="color:#0F172A;font-size:14px;font-weight:600;padding:6px 0">{interview_date}</td>
        </tr>
        <tr>
          <td style="color:#64748B;font-size:13px;padding:6px 0">💻 Platform</td>
          <td style="color:#0F172A;font-size:14px;font-weight:600;padding:6px 0">{platform}</td>
        </tr>
        <tr>
          <td style="color:#64748B;font-size:13px;padding:6px 0">🔗 Meet Link</td>
          <td style="padding:6px 0">
            <a href="{meet_link}" style="color:#4F46E5;font-size:13px;word-break:break-all">{meet_link}</a>
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA Button -->
    <div style="text-align:center;margin:0 0 32px">
      <a href="{meet_link}"
         style="display:inline-block;background:linear-gradient(135deg,#4F46E5,#7C3AED);color:#fff;font-size:16px;font-weight:700;padding:18px 48px;border-radius:14px;text-decoration:none;letter-spacing:0.02em;box-shadow:0 8px 24px rgba(79,70,229,0.35)">
        🎥 { "Start AI Interview" if "Nexus" in platform else "Join Interview" }
      </a>
    </div>

    <p style="color:#64748B;font-size:13px;line-height:1.6;margin:0 0 8px">
      Please join 2–3 minutes early so we can start on time.
      If you need to reschedule, simply reply to this email.
    </p>
  </div>

  <!-- Footer -->
  <div style="background:#F1F5F9;padding:24px 32px;text-align:center">
    <p style="color:#94A3B8;font-size:12px;margin:0">
      Sent by <strong style="color:#6366F1">NEXUS AI Recruitment Platform</strong> · HireSync<br>
      This is an automated message. Please do not reply directly.
    </p>
  </div>
</div>
"""


# ──────────────────────────────────────────────────────────────────────────────
# Email Dispatch
# ──────────────────────────────────────────────────────────────────────────────

def send_recruiter_email(
    to_email: str,
    subject: str,
    plain_body: str,
    html_body: str,
) -> bool:
    """Send the generated recruitment email via SMTP."""
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"[AI Recruiter] SMTP not configured – skipping email to {to_email}")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["From"]    = f"NEXUS HireSync <{SENDER_EMAIL}>"
        msg["To"]      = to_email
        msg["Subject"] = subject

        msg.attach(MIMEText(plain_body, "plain"))
        msg.attach(MIMEText(
            f"<html><head><meta charset='UTF-8'></head><body>{html_body}</body></html>",
            "html",
        ))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)

        print(f"[AI Recruiter] ✅ Recruitment email sent to {to_email}")
        return True

    except smtplib.SMTPAuthenticationError:
        print(f"[AI Recruiter] ❌ SMTP Auth Error for {SENDER_EMAIL}. Check App Password.")
        return False
    except Exception as e:
        print(f"[AI Recruiter] ❌ Failed to send email to {to_email}: {e}")
        return False
