/**
 * Client-side Interview Agent using Puter.js
 */

export interface InterviewContext {
    candidate_name: string;
    role: string;
    candidate_summary: string;
}

export class InterviewAgentClient {
    private context: InterviewContext;

    constructor(context: InterviewContext) {
        this.context = context;
    }

    private getSystemPrompt(turnCount: number = 0): string {
        const wrapUpInstruction = turnCount >= 6 
            ? "CRITICAL: The interview has gone on long enough. Do NOT ask any more questions. Thank the candidate for their time, mention that the team will review their profile, and say goodbye."
            : "If the interview has gone on for about 6-8 exchanges, thank them and let them know the team will be in touch.";

        return `
You are "Nexus", a highly professional and empathetic AI Recruitment Agent for the company "HireSync".
Your goal is to conduct a screening interview with ${this.context.candidate_name} for the position of ${this.context.role}.

CONTEXT:
- Role: ${this.context.role}
- Candidate Background: ${this.context.candidate_summary || "An applicant with relevant skills for the role."}

GUIDELINES:
1. Be professional, warm, and engaging.
2. Ask one question at a time.
3. Dive into their experience, specific skills relevant to the role, and their motivation.
4. If they give short answers, ask follow-up questions to dig deeper.
5. ${wrapUpInstruction}
6. Avoid being repetitive.
7. Maintain the persona of a human-like recruitment professional.

Your response should be just the text of what you would say to the candidate.
`;
    }

    async generateResponse(transcript: { role: string, content: string }[]): Promise<string> {
        // @ts-ignore - puter is global via script tag
        if (!window.puter || !window.puter.ai) {
            console.error("InterviewAgentClient: Puter.js not loaded on window");
            throw new Error("AI Service Unavailable");
        }

        const candidateTurns = transcript.filter(t => t.role === 'candidate' || t.role === 'user').length;
        const historyStr = transcript.map(t => {
            const role = String(t.role || 'user').toUpperCase();
            const content = typeof t.content === 'object' ? JSON.stringify(t.content) : String(t.content || '');
            return `${role}: ${content}`;
        }).join('\n');
        
        const fullPrompt = `${this.getSystemPrompt(candidateTurns)}\n\nINTERVIEW HISTORY:\n${historyStr}\n\nAGENT:`;
        
        try {
            // @ts-ignore
            const response = await window.puter.ai.chat(fullPrompt);
            
            if (response && response.message && response.message.content) {
                const content = response.message.content;
                if (typeof content === 'string') return content.trim();
                if (Array.isArray(content)) {
                    // @ts-ignore
                    return content.map(block => typeof block === 'string' ? block : (block.text || "")).join("").trim();
                }
            }
            
            // Fallback for different SDK versions
            if (typeof response === 'string') return response.trim();
            if (response && typeof response === 'object' && 'text' in response) return (response as any).text.trim();
            
            throw new Error("Invalid response from AI service");
        } catch (error) {
            console.error("Puter AI Error:", error);
            throw error;
        }
    }
}
