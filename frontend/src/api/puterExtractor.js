/**
 * Uses Puter's Free AI to extract structured resume fields.
 * Assumes 'puter' is globally available via the script tag.
 */
export async function extractResumeFields(resumeText) {
    const prompt = `You are a resume parser. Extract the following fields from the resume below and return ONLY a valid JSON object — no explanation, no markdown.

Fields to extract:
- name: Full name of the candidate
- email: Email address
- phone: Phone number
- skills: Array of technical and soft skills
- experience: Array of work experience entries (string: "Title at Company (dates): description")
- education: Array of education entries (string: "Degree in Field, Institution (year)")
- summary: A brief professional summary if present, otherwise null

Resume:
"""
${resumeText}
"""

Return only this JSON structure:
{
  "name": "...",
  "email": "...",
  "phone": "...",
  "skills": ["...", "..."],
  "experience": ["...", "..."],
  "education": ["...", "..."],
  "summary": "..."
}`;

    try {
        // Use Puter's native AI chat
        const response = await window.puter.ai.chat(prompt);

        let rawContent = response.message.content.trim();
        // Clean markdown wrap if Claude outputs it
        rawContent = rawContent.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1');
        return JSON.parse(rawContent);
    } catch (error) {
        console.error("Failed to parse resume via Puter:", error);
        return null;
    }
}