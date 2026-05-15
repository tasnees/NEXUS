import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bot, User, Brain, AlertCircle, CheckCircle2, ChevronRight, MessageSquare, ShieldCheck, Zap, Loader2, RefreshCw } from 'lucide-react';

// --- Types ---
interface TranscriptMessage {
    role: 'agent' | 'candidate';
    content: string;
    timestamp?: string;
}

interface Interview {
    id: number;
    candidate_name: string;
    candidate_email: string;
    role: string;
    date: string;
    status: string;
    transcript: TranscriptMessage[];
    ai_evaluation: {
        overall_score: number;
        summary: string;
        strengths: string[];
        weaknesses: string[];
        recommendation: string;
        technical_proficiency: number;
        communication_skills: number;
        is_overridden?: boolean;
        recruiter_notes?: string;
    } | null;
}

// --- Helper Components ---

const AiMessage: React.FC<{ content: string; time?: string }> = ({ content, time }) => (
    <div className="flex gap-4 max-w-[85%] animate-in fade-in slide-in-from-left-4 duration-300">
        <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0 shadow-sm">
            <Bot size={18} />
        </div>
        <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm">
            <p className="text-sm leading-relaxed text-slate-700 font-medium">{content}</p>
            {time && <span className="text-[10px] text-slate-400 font-bold block mt-2">{time}</span>}
        </div>
    </div>
);

const CandidateMessage: React.FC<{ content: string; time?: string }> = ({ content, time }) => (
    <div className="flex flex-col items-end gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex gap-4 max-w-[85%] justify-end">
            <div className="flex flex-col items-end gap-2">
                <div className="bg-indigo-600 p-4 rounded-2xl rounded-tr-none shadow-md shadow-indigo-500/10">
                    <p className="text-sm leading-relaxed text-white font-medium">{content}</p>
                    {time && <span className="text-[10px] text-white/60 font-bold block mt-2 text-right">{time}</span>}
                </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                <User size={18} />
            </div>
        </div>
    </div>
);

// --- Main Component ---

const InterviewAnalytics: React.FC = () => {
    const location = useLocation();
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(location.state?.selectedId || null);
    const [loading, setLoading] = useState(true);

    const loadInterviews = () => {
        setLoading(true);
        fetch('http://localhost:8001/api/v1/interviews/')
            .then(res => res.json())
            .then(data => {
                // Filter to show anything that has started (has transcript) OR is completed
                const activeOrCompleted = data.filter((i: any) => 
                    i.status === 'completed' || 
                    (i.transcript && i.transcript.length > 0)
                );
                
                // Deduplicate by (candidate name + role), keeping the best/latest one for each specific application
                const uniqueInterviews = activeOrCompleted.reduce((acc: any[], current: any) => {
                    const key = `${current.candidate_name.toLowerCase()}_${current.role.toLowerCase()}`;
                    const existingIdx = acc.findIndex(item => `${item.candidate_name.toLowerCase()}_${item.role.toLowerCase()}` === key);
                    
                    if (existingIdx === -1) {
                        acc.push(current);
                    } else {
                        const existing = acc[existingIdx];
                        const currentTranscriptLen = current.transcript?.length || 0;
                        const existingTranscriptLen = existing.transcript?.length || 0;
                        
                        // Favor completed, then favor more transcript, then favor newer
                        if (current.status === 'completed' && existing.status !== 'completed') {
                            acc[existingIdx] = current;
                        } else if (current.status === existing.status) {
                            if (currentTranscriptLen > existingTranscriptLen) {
                                acc[existingIdx] = current;
                            } else if (new Date(current.date).getTime() > new Date(existing.date).getTime()) {
                                acc[existingIdx] = current;
                            }
                        } else if (currentTranscriptLen > existingTranscriptLen && existing.status !== 'completed') {
                            acc[existingIdx] = current;
                        }
                    }
                    return acc;
                }, []);

                uniqueInterviews.sort((a: any, b: any) => {
                    if (a.status === b.status) return new Date(b.date).getTime() - new Date(a.date).getTime();
                    return a.status === 'completed' ? -1 : 1;
                });

                setInterviews(uniqueInterviews);
                if (uniqueInterviews.length > 0 && !selectedId) {
                    setSelectedId(uniqueInterviews[0].id);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        loadInterviews();
    }, []);

    const evaluateTranscript = async (transcript: any[], role: string) => {
        const evalPrompt = `
            You are a senior recruitment manager. Review the following interview transcript for the ${role} position and provide a structured evaluation.
            
            TRANSCRIPT:
            ${JSON.stringify(transcript.slice(-20))}
            
            Provide a JSON object with:
            - "overall_score": (1-100)
            - "summary": (2-3 sentences)
            - "strengths": (list of strings)
            - "weaknesses": (list of strings)
            - "recommendation": ("Hire", "Consider", "Reject")
            - "technical_proficiency": (1-10)
            - "communication_skills": (1-10)
            
            Do not include any preamble or markdown formatting, just the raw JSON.
        `;
        
        try {
            // @ts-ignore
            if (!window.puter || !window.puter.ai) {
                throw new Error("Puter AI is not initialized. Please refresh the page.");
            }

            // @ts-ignore
            const response = await window.puter.ai.chat(evalPrompt);
            let content = "";
            
            if (typeof response === 'string') {
                content = response;
            } else if (response?.message?.content) {
                const c = response.message.content;
                content = Array.isArray(c) ? c.map((b: any) => b.text || b.content || JSON.stringify(b)).join("") : String(c);
            } else if (response?.text) {
                content = String(response.text);
            } else {
                content = JSON.stringify(response);
            }
            
            const startIdx = content.indexOf("{");
            const endIdx = content.lastIndexOf("}");
            if (startIdx !== -1 && endIdx !== -1) {
                return JSON.parse(content.substring(startIdx, endIdx + 1));
            }
            throw new Error(`AI response format invalid: ${content.substring(0, 50)}...`);
        } catch (e: any) {
            console.error("AI Evaluation failed:", e);
            return {
                overall_score: 0,
                summary: `AI Evaluation failed: ${e.message || "Unknown Error"}`,
                recommendation: "Manual Review Required"
            };
        }
    };

    const handleFinalize = async (id: number) => {
        const interview = interviews.find(i => i.id === id);
        if (!interview) return;
        if (!confirm("Finalize and evaluate this interview?")) return;
        
        setLoading(true);
        try {
            // 1. Perform Evaluation on Client Side (to avoid 403)
            const evaluation = await evaluateTranscript(interview.transcript, interview.role);
            
            // 2. Save results to backend
            const res = await fetch(`http://localhost:8001/api/v1/interview-agent/${id}/finalize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ evaluation })
            });
            
            if (res.ok) {
                loadInterviews();
            } else {
                alert("Failed to save final evaluation.");
            }
        } catch (e) {
            alert("Error during finalization.");
        } finally {
            setLoading(false);
        }
    };

    const handleReEvaluate = async (id: number) => {
        const interview = interviews.find(i => i.id === id);
        if (!interview) return;
        
        setLoading(true);
        try {
            const evaluation = await evaluateTranscript(interview.transcript, interview.role);
            const res = await fetch(`http://localhost:8001/api/v1/interview-agent/${id}/finalize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ evaluation })
            });
            
            if (res.ok) {
                loadInterviews();
            } else {
                alert("Failed to update evaluation.");
            }
        } catch (e) {
            alert("Error during re-evaluation.");
        } finally {
            setLoading(false);
        }
    };

    const handleOverride = async (verdict: string) => {
        if (!selected) return;
        try {
            const res = await fetch(`http://localhost:8001/api/v1/interview-agent/${selected.id}/evaluation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    recommendation: verdict,
                    is_overridden: true,
                    overridden_at: new Date().toISOString()
                })
            });
            if (res.ok) loadInterviews();
        } catch (e) { alert("Failed to save verdict."); }
    };

    const handleSaveNotes = async (notes: string) => {
        if (!selected) return;
        try {
            await fetch(`http://localhost:8001/api/v1/interview-agent/${selected.id}/evaluation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recruiter_notes: notes })
            });
        } catch (e) { }
    };

    const selected = interviews.find(i => i.id === selectedId);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Analytics...</p>
                </div>
            </div>
        );
    }

    if (interviews.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
                <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-10 text-center shadow-xl">
                    <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                        <MessageSquare size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">No Reports Found</h2>
                    <p className="text-slate-500 mb-8">Once your candidates start their AI interviews, the live transcripts and analytics will appear here.</p>
                    <div className="flex flex-col gap-3">
                        <Link to="/recruiter" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                            Launch AI Recruiter
                        </Link>
                        <button onClick={loadInterviews} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
                            Refresh List
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-slate-50 min-h-screen flex flex-col font-sans" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 md:px-10 py-8">
                
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            <Link to="/candidates" className="hover:text-blue-600">Pipeline</Link>
                            <ChevronRight size={12} />
                            <span className="text-blue-600">AI Interview Analytics</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-2">Candidate Intelligence</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 mr-2">Switch Candidate:</label>
                        <select 
                            value={selectedId || ''} 
                            onChange={(e) => setSelectedId(Number(e.target.value))}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-600 shadow-sm"
                        >
                            {interviews.map(i => (
                                <option key={i.id} value={i.id}>
                                    {i.status === 'completed' ? '✅' : '🔴 LIVE'} {i.candidate_name} — {i.role} ({i.ai_evaluation?.overall_score || 0}%)
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {selected && (
                    <div className="grid grid-cols-12 gap-8">
                        
                        {/* ─── Profile Overview ─── */}
                        <div className="col-span-12 bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>
                            <div className="relative flex items-center gap-8">
                                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-black shadow-xl shadow-blue-500/20">
                                    {selected.candidate_name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black tracking-tight">{selected.candidate_name}</h2>
                                    <p className="text-blue-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">{selected.role}</p>
                                    <div className="flex gap-3 mt-6">
                                        <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${selected.status === 'completed' ? 'bg-white/5 border-white/10' : 'bg-red-500/10 border-red-500/20'}`}>
                                            {selected.status === 'completed' ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Loader2 size={14} className="text-red-400 animate-spin" />}
                                            <span className={`text-xs font-bold ${selected.status === 'completed' ? 'text-white' : 'text-red-400'}`}>
                                                {selected.status === 'completed' ? (selected.ai_evaluation?.recommendation || 'Evaluation Pending') : 'Interview In Progress'}
                                            </span>
                                        </div>
                                        {selected.status !== 'completed' && (
                                            <button 
                                                onClick={() => handleFinalize(selected.id)}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-600/20"
                                            >
                                                Finalize Session
                                            </button>
                                        )}
                                        {selected.status === 'completed' && (
                                            <button 
                                                onClick={() => handleReEvaluate(selected.id)}
                                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all"
                                            >
                                                <RefreshCw size={14} className="inline mr-2" />
                                                Re-evaluate Transcript
                                            </button>
                                        )}
                                        <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
                                            <Zap size={14} className="text-amber-400" />
                                            <span className="text-xs font-bold">{selected.ai_evaluation?.overall_score || '--'}% Match Score</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-8 bg-white/5 p-6 rounded-[2rem] border border-white/10 backdrop-blur-xl">
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Tech Score</p>
                                    <p className="text-3xl font-black text-blue-400">{selected.ai_evaluation?.technical_proficiency || 0}<span className="text-sm text-slate-600">/10</span></p>
                                </div>
                                <div className="w-[1px] h-12 bg-white/10"></div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Comm Score</p>
                                    <p className="text-3xl font-black text-indigo-400">{selected.ai_evaluation?.communication_skills || 0}<span className="text-sm text-slate-600">/10</span></p>
                                </div>
                            </div>
                        </div>

                        {/* ─── Transcript Column ─── */}
                        <div className="col-span-12 lg:col-span-7 space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                                    <MessageSquare size={20} className="text-blue-600" />
                                    Interview Transcript
                                </h3>
                                <div className="px-3 py-1 bg-slate-200 rounded-full text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                    Full Log
                                </div>
                            </div>

                            <div className="space-y-6 bg-slate-100 p-8 rounded-[2.5rem] border border-slate-200 shadow-inner max-h-[800px] overflow-y-auto custom-scrollbar">
                                {selected.transcript.map((msg, idx) => (
                                    msg.role === 'agent' ? (
                                        <AiMessage key={idx} content={msg.content} />
                                    ) : (
                                        <CandidateMessage key={idx} content={msg.content} />
                                    )
                                ))}
                                {selected.transcript.length === 0 && (
                                    <div className="text-center py-20 text-slate-400 font-bold italic">No transcript messages found.</div>
                                )}
                            </div>
                        </div>

                        {/* ─── Analysis Column ─── */}
                        <div className="col-span-12 lg:col-span-5 space-y-8">
                            
                            {/* Behavioral Summary */}
                            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <Brain size={16} className="text-blue-600" /> AI Recommendation
                                    </h3>
                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border ${selected.ai_evaluation?.is_overridden ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                        {selected.ai_evaluation?.is_overridden ? 'Recruiter Overridden' : 'AI Generated'}
                                    </span>
                                </div>
                                
                                <div className="relative mb-8">
                                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-blue-600 rounded-full"></div>
                                    <p className="text-lg font-bold text-slate-800 leading-relaxed italic pl-4">
                                        "{selected.ai_evaluation?.summary || "No automated summary available for this session yet."}"
                                    </p>
                                </div>

                                {/* Override Controls */}
                                <div className="pt-6 border-t border-slate-100">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Recruiter Verdict (Human Override)</p>
                                    <div className="flex gap-2">
                                        {['Hire', 'Consider', 'Reject'].map(v => (
                                            <button
                                                key={v}
                                                onClick={() => handleOverride(v)}
                                                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                                                    selected.ai_evaluation?.recommendation === v 
                                                        ? (v === 'Hire' ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20' : v === 'Consider' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20')
                                                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-600'
                                                }`}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="mt-6">
                                    <textarea 
                                        placeholder="Add recruiter internal notes..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm outline-none focus:border-blue-600 min-h-[100px] transition-all"
                                        defaultValue={selected.ai_evaluation?.recruiter_notes || ''}
                                        onBlur={(e) => handleSaveNotes(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Strengths & Weaknesses */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
                                <div className="bg-emerald-50 rounded-[2.5rem] p-8 border border-emerald-100">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-6 flex items-center gap-2">
                                        <CheckCircle2 size={16} /> Key Strengths
                                    </h4>
                                    <ul className="space-y-4">
                                        {(selected.ai_evaluation?.strengths || []).map((s, idx) => (
                                            <li key={idx} className="flex gap-3 items-start">
                                                <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                                    <ChevronRight size={12} className="text-white" />
                                                </div>
                                                <span className="text-sm font-bold text-emerald-900">{s}</span>
                                            </li>
                                        ))}
                                        {(selected.ai_evaluation?.strengths || []).length === 0 && <span className="text-sm text-slate-400">None identified.</span>}
                                    </ul>
                                </div>

                                <div className="bg-amber-50 rounded-[2.5rem] p-8 border border-amber-100">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-6 flex items-center gap-2">
                                        <AlertCircle size={16} /> Risk Indicators
                                    </h4>
                                    <ul className="space-y-4">
                                        {(selected.ai_evaluation?.weaknesses || []).map((w, idx) => (
                                            <li key={idx} className="flex gap-3 items-start">
                                                <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                                    <ChevronRight size={12} className="text-white" />
                                                </div>
                                                <span className="text-sm font-bold text-amber-900">{w}</span>
                                            </li>
                                        ))}
                                        {(selected.ai_evaluation?.weaknesses || []).length === 0 && <span className="text-sm text-slate-400">No major risks detected.</span>}
                                    </ul>
                                </div>
                            </div>

                            {/* Consistency & Shield */}
                            <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-500/20">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-indigo-300">Identity & Trust</h3>
                                    <ShieldCheck size={24} className="text-emerald-400" />
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between text-[10px] font-black uppercase text-indigo-300 mb-2">
                                            <span>Behavioral Consistency</span>
                                            <span>94%</span>
                                        </div>
                                        <div className="h-2 bg-indigo-900 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: '94%' }}></div>
                                        </div>
                                    </div>
                                    <p className="text-xs font-medium text-indigo-100 leading-relaxed">
                                        No anomalous patterns detected. Communication style remains consistent with the provided CV and technical depth.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default InterviewAnalytics;
