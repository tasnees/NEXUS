import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Bot, 
    Users, 
    Send, 
    Eye, 
    X, 
    CheckCircle, 
    AlertCircle, 
    Info, 
    Terminal,
    Search,
    ChevronRight,
    Loader2,
    Calendar,
    Globe,
    Mail,
    Zap,
    Briefcase
} from 'lucide-react';

const API = 'http://localhost:8001';

interface Candidate {
    id: number;
    name: string;
    email: string;
    applied_job: string;
    skills: string[];
    summary: string;
    score: number;
}

interface LogEntry {
    time: string;
    level: 'info' | 'success' | 'error' | 'ai';
    message: string;
}

interface PreviewData {
    candidate_name: string;
    candidate_email: string;
    role: string;
    subject: string;
    plain_body: string;
    html_preview: string;
}

const AIRecruiter: React.FC = () => {
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [meetLink, setMeetLink] = useState('');
    const [interviewDate, setInterviewDate] = useState('');
    const [interviewType, setInterviewType] = useState('screening');
    const [useAiAgent, setUseAiAgent] = useState(false);
    const [searchQ, setSearchQ] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [previewLoading, setPreviewLoading] = useState<number | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const logRef = useRef<HTMLDivElement>(null);

    // Toast state
    const [toasts, setToasts] = useState<Array<{id: number, msg: string, type: 'success' | 'danger' | 'info'}>>([]);

    const showToast = (msg: string, type: 'success' | 'danger' | 'info' = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    /* ── Fetch candidates ── */
    useEffect(() => {
        fetch(`${API}/api/v1/candidates/`)
            .then(r => r.json())
            .then(d => { setCandidates(d); setFetching(false); })
            .catch(() => { setFetching(false); showToast("Failed to load candidates", "danger"); });
    }, []);

    /* ── Auto-scroll log ── */
    useEffect(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, [logs]);

    const addLog = (level: LogEntry['level'], message: string) =>
        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), level, message }]);

    /* ── Filtered list ── */
    const filtered = candidates.filter(c =>
        [c.name, c.email, c.applied_job].some(f =>
            (f || '').toLowerCase().includes(searchQ.toLowerCase())
        )
    );

    const toggleAll = () => {
        if (selected.size === filtered.length) setSelected(new Set());
        else setSelected(new Set(filtered.map(c => c.id)));
    };

    /* ── Preview email ── */
    const handlePreview = async (candidateId: number) => {
        setPreviewLoading(candidateId);
        try {
            const params = new URLSearchParams({
                meet_link: meetLink || 'https://meet.google.com/example',
                ...(interviewDate && { interview_date: interviewDate }),
            });
            const r = await fetch(`${API}/api/v1/recruiter/preview/${candidateId}?${params}`);
            const d = await r.json();
            setPreview(d);
            setShowPreview(true);
        } catch (e) {
            addLog('error', `Preview failed: ${e}`);
            showToast("Preview generation failed", "danger");
        } finally {
            setPreviewLoading(null);
        }
    };

    /* ── Recruit selected ── */
    const handleRecruit = async () => {
        if (!useAiAgent && !meetLink.trim()) { showToast("Meet link is required", "info"); return; }
        if (selected.size === 0) { showToast("Select candidates first", "info"); return; }

        setLoading(true);
        setLogs([]);
        addLog('ai', `🤖 AI Recruiter starting – targeting ${selected.size} candidate(s)…`);
        showToast("Recruitment process started", "info");

        const ids = Array.from(selected);
        let successCount = 0;

        for (const id of ids) {
            const c = candidates.find(x => x.id === id)!;
            addLog('info', `Processing ${c.name} (${c.email || 'no email'})…`);
            try {
                const r = await fetch(`${API}/api/v1/recruiter/recruit/${id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        meet_link: useAiAgent ? undefined : meetLink,
                        interview_date: interviewDate || undefined,
                        interview_type: interviewType,
                        use_ai_agent: useAiAgent,
                    }),
                });
                const d = await r.json();
                if (r.ok) {
                    addLog('success', `✅ ${d.message}`);
                    successCount++;
                } else {
                    addLog('error', `❌ ${c.name}: ${d.detail || 'Unknown error'}`);
                }
            } catch (e) {
                addLog('error', `❌ Network error for ${c.name}: ${e}`);
            }
        }

        addLog('ai', `🎉 Done! ${successCount}/${ids.length} recruitment emails dispatched.`);
        showToast(`Dispatched ${successCount} emails`, "success");
        setLoading(false);
    };

    const logColors: Record<LogEntry['level'], string> = {
        info: 'text-txt-muted',
        success: 'text-success',
        error: 'text-danger',
        ai: 'text-secondary',
    };

    return (
        <div className="flex-1 flex flex-col bg-base animate-fade-in relative pb-12">
            {/* Header Section */}
            <section className="px-8 pt-6 pb-0">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-txt-muted mb-1">
                            <button onClick={() => navigate('/dashboard')} className="hover:text-primary transition-colors">Overview</button>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-txt-primary">AI Recruiter</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Bot className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold tracking-tight text-txt-primary">AI Recruiter</h2>
                                <p className="text-sm text-txt-muted mt-0.5">Automated personalized outreach powered by Claude</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Stats */}
            <section className="px-8 pt-5 pb-0">
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { icon: Users, color: 'blue', label: 'Total Candidates', value: candidates.length },
                        { icon: CheckCircle, color: 'emerald', label: 'Selected', value: selected.size },
                        { icon: Mail, color: 'amber', label: 'With Email', value: candidates.filter(c => c.email).length },
                    ].map((s, idx) => (
                        <div key={idx} className="stat-card bg-surface rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg bg-${s.color}-50 flex items-center justify-center`}>
                                    <s.icon className={`w-[18px] h-[18px] text-${s.color}-600`} />
                                </div>
                                <div>
                                    <p className="text-xl font-semibold text-txt-primary">{s.value}</p>
                                    <p className="text-xs text-txt-muted font-medium">{s.label}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="px-8 pt-6 flex-1 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-8 h-full items-start">
                    
                    {/* LEFT: Candidate Selection */}
                    <div className="bg-surface rounded-2xl border border-bdr shadow-sm flex flex-col h-[calc(100vh-190px)] min-h-[650px] overflow-hidden transition-all duration-300">
                        <div className="p-4 border-b border-bdr flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-sm font-bold text-txt-primary uppercase tracking-wider">Select Candidates</h3>
                            <button 
                                onClick={toggleAll}
                                className="text-xs font-bold text-primary hover:underline px-3 py-1 bg-primary/5 rounded-lg"
                            >
                                {selected.size === filtered.length && filtered.length > 0 ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        
                        <div className="p-4 border-b border-bdr">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Search candidates by name, email, or role..." 
                                    className="w-full bg-base border border-bdr rounded-xl px-4 py-2.5 pl-10 text-sm outline-none focus:border-primary transition-all"
                                    value={searchQ}
                                    onChange={e => setSearchQ(e.target.value)}
                                />
                                <Search className="w-4 h-4 text-txt-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            {fetching ? (
                                <div className="py-12 text-center text-txt-muted animate-pulse">Loading candidates...</div>
                            ) : filtered.length === 0 ? (
                                <div className="py-12 text-center text-txt-muted">No candidates found</div>
                            ) : filtered.map(c => {
                                const isSelected = selected.has(c.id);
                                return (
                                    <div 
                                        key={c.id}
                                        onClick={() => {
                                            const s = new Set(selected);
                                            isSelected ? s.delete(c.id) : s.add(c.id);
                                            setSelected(s);
                                        }}
                                        className={`flex items-start gap-5 p-4 rounded-2xl border transition-all cursor-pointer ${isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'}`}
                                    >
                                        <div className={`mt-1.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary text-white' : 'border-slate-200 bg-white'}`}>
                                            {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                                        </div>
                                        
                                        <div className="mt-0.5 w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0 border border-slate-200/50 shadow-inner">
                                            {(c.name || '?').charAt(0).toUpperCase()}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <p className="text-base font-bold text-txt-primary truncate">{c.name || 'Unknown'}</p>
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${c.score >= 90 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : c.score >= 70 ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                        {c.score}% Match
                                                    </span>
                                                </div>
                                                <button 
                                                    onClick={e => { e.stopPropagation(); handlePreview(c.id); }}
                                                    disabled={previewLoading === c.id}
                                                    className="p-2 rounded-xl hover:bg-white border border-slate-100 bg-white/50 text-txt-muted hover:text-primary transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm"
                                                >
                                                    {previewLoading === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                                                    Preview Email
                                                </button>
                                            </div>
                                            <p className="text-xs text-txt-muted mb-3 flex items-center gap-1.5 font-medium">
                                                <Mail className="w-3 h-3 opacity-50" /> {c.email || 'No email provided'}
                                            </p>
                                            
                                            {c.summary && (
                                                <p className="text-xs text-txt-secondary line-clamp-2 leading-relaxed bg-slate-50/80 p-2.5 rounded-xl border border-slate-100/50 mb-3 italic">
                                                    "{c.summary}"
                                                </p>
                                            )}

                                            <div className="flex flex-wrap items-center gap-2">
                                                {c.applied_job && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                                                        <Briefcase className="w-3 h-3" /> {c.applied_job}
                                                    </span>
                                                )}
                                                {c.skills && c.skills.slice(0, 4).map(skill => (
                                                    <span key={skill} className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold border border-slate-200/50">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {c.skills && c.skills.length > 4 && (
                                                    <span className="text-[10px] font-bold text-slate-400">+{c.skills.length - 4} more</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* RIGHT: Controls & Logs */}
                    <div className="space-y-6">
                        {/* Settings Card */}
                        <div className="bg-surface rounded-2xl border border-bdr shadow-sm p-6 space-y-6">
                            <h3 className="text-sm font-black text-txt-primary uppercase tracking-widest flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-500" /> Settings
                            </h3>

                            <div 
                                onClick={() => setUseAiAgent(!useAiAgent)}
                                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${useAiAgent ? 'border-secondary bg-secondary/5' : 'border-bdr bg-base hover:border-bdr-light'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${useAiAgent ? 'bg-secondary text-white' : 'bg-slate-200 text-slate-500'}`}>
                                        <Bot className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-txt-primary">AI Agent Mode</p>
                                        <p className="text-[10px] text-txt-muted uppercase font-bold tracking-tighter leading-tight">Nexus will conduct the interview</p>
                                    </div>
                                </div>
                                <div className={`w-10 h-5 rounded-full relative transition-all ${useAiAgent ? 'bg-secondary' : 'bg-slate-300'}`}>
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${useAiAgent ? 'right-1' : 'left-1'}`} />
                                </div>
                            </div>

                            {!useAiAgent && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-txt-muted uppercase tracking-widest ml-1">Meet / Zoom Link</label>
                                    <div className="relative">
                                        <input 
                                            type="url" 
                                            placeholder="https://meet.google.com/..."
                                            className="w-full bg-base border border-bdr rounded-xl px-4 py-3 pl-10 text-sm font-bold outline-none focus:border-primary transition-all"
                                            value={meetLink}
                                            onChange={e => setMeetLink(e.target.value)}
                                        />
                                        <Globe className="w-4 h-4 text-txt-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-txt-muted uppercase tracking-widest ml-1">Interview Date & Time</label>
                                    <div className="relative">
                                        <input 
                                            type="datetime-local" 
                                            className="w-full bg-base border border-bdr rounded-xl px-4 py-3 pl-10 text-sm font-bold outline-none focus:border-primary transition-all"
                                            value={interviewDate}
                                            onChange={e => setInterviewDate(e.target.value)}
                                        />
                                        <Calendar className="w-4 h-4 text-txt-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-txt-muted uppercase tracking-widest ml-1">Interview Type</label>
                                    <select 
                                        className="w-full bg-base border border-bdr rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary transition-all appearance-none"
                                        value={interviewType}
                                        onChange={e => setInterviewType(e.target.value)}
                                    >
                                        <option value="screening">Screening</option>
                                        <option value="technical">Technical</option>
                                        <option value="final">Final Round</option>
                                    </select>
                                </div>
                            </div>

                            <button 
                                onClick={handleRecruit}
                                disabled={loading || selected.size === 0 || (!useAiAgent && !meetLink.trim())}
                                className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                {loading ? 'Recruiting...' : `Recruit ${selected.size > 0 ? selected.size : ''} Candidates`}
                            </button>
                        </div>

                        {/* Logs Card */}
                        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl min-h-[200px] flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Terminal className="w-3 h-3" /> System Logs
                                </h3>
                                {logs.length > 0 && <button onClick={() => setLogs([])} className="text-[10px] text-slate-600 hover:text-slate-400 font-bold uppercase tracking-widest transition-colors">Clear</button>}
                            </div>
                            <div 
                                ref={logRef}
                                className="flex-1 overflow-y-auto space-y-2 font-mono text-[11px] custom-scrollbar max-h-[200px]"
                            >
                                {logs.length === 0 ? (
                                    <p className="text-slate-700 text-center py-8 italic">Awaiting recruitment run...</p>
                                ) : logs.map((l, i) => (
                                    <div key={i} className="flex gap-3 leading-relaxed">
                                        <span className="text-slate-600 shrink-0">{l.time}</span>
                                        <span className={logColors[l.level]}>{l.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Email Preview Modal */}
            {showPreview && preview && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-all" onClick={() => setShowPreview(false)}></div>
                    <div className="relative bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl border border-bdr overflow-hidden flex flex-col max-h-[90vh] animate-zoom-in">
                        <div className="px-8 py-6 border-b border-bdr bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-txt-primary leading-none">Email Preview</h3>
                                    <p className="text-xs text-txt-muted mt-1">To: <span className="font-bold text-txt-secondary">{preview.candidate_email}</span></p>
                                </div>
                            </div>
                            <button onClick={() => setShowPreview(false)} className="p-3 rounded-2xl hover:bg-white hover:shadow-md transition-all text-txt-muted">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="px-8 py-4 bg-primary/5 border-b border-primary/10">
                            <p className="text-xs font-bold text-primary uppercase tracking-widest inline-block mr-2">Subject:</p>
                            <span className="text-sm font-bold text-txt-primary">{preview.subject}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30 custom-scrollbar">
                            <div className="bg-white rounded-3xl p-8 border border-bdr shadow-sm text-txt-secondary leading-relaxed email-preview" dangerouslySetInnerHTML={{ __html: preview.html_preview }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Toasts */}
            <div className="fixed top-4 right-4 z-[110] space-y-2 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className="toast flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl bg-white min-w-[280px] pointer-events-auto">
                        {t.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                        {t.type === 'danger' && <AlertCircle className="w-5 h-5 text-red-500" />}
                        {t.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                        <span className="text-sm font-semibold text-txt-primary">{t.msg}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AIRecruiter;
