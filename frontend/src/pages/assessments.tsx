import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Plus, Search, X, Sparkles, Edit3, Trash2, Eye, ChevronRight, Loader, Briefcase, Code2, Brain, Zap, AlertCircle, CheckCircle2, Send, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:8001/api/v1';

interface Assessment { id: number; title: string; duration: string; difficulty: string; focus: string[]; description: string; steps: string[]; required_format: string; grading_threshold: number; auto_reject: number; evaluation_nodes: string[]; job_id: number; }
interface Job { id: number; title: string; tags: string[]; }

const DIFF_COLOR: Record<string,string> = { Expert:'bg-red-50 text-red-600 border-red-100', Intermediate:'bg-amber-50 text-amber-600 border-amber-100', Easy:'bg-emerald-50 text-emerald-600 border-emerald-100' };
const FORMAT_ICON: Record<string,any> = { python: Code2, javascript: Code2, sql: Code2, default: Brain };

const Assessments: React.FC = () => {
    const navigate = useNavigate();
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(false);
    const [mode, setMode] = useState<'pick'|'manual'|'ai'>('pick');
    const [submitting, setSubmitting] = useState(false);
    const [detail, setDetail] = useState<Assessment|null>(null);
    const [toasts, setToasts] = useState<{id:number,msg:string,type:string}[]>([]);

    const [form, setForm] = useState({ title:'', difficulty:'Intermediate', language:'python', steps:'', topic:'', job_id:0 });

    const toast = (msg: string, type='success') => {
        const id = Date.now();
        setToasts(p => [...p, {id, msg, type}]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
    };

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [jr, ar] = await Promise.all([fetch(`${API}/jobs/`), fetch(`${API}/assessments/`)]);
            if (jr.ok) setJobs(await jr.json());
            if (ar.ok) setAssessments(await ar.json());
        } catch { toast('Failed to load data','danger'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const openModal = () => { setModal(true); setMode('pick'); setForm({ title:'', difficulty:'Intermediate', language:'python', steps:'', topic:'', job_id: jobs[0]?.id || 0 }); };
    const closeModal = () => { setModal(false); setMode('pick'); };

    const submitManual = async () => {
        if (!form.title || !form.job_id) return toast('Title and job are required','danger');
        setSubmitting(true);
        try {
            const res = await fetch(`${API}/assessments/`, {
                method:'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ title: form.title, duration:'2 Hours', difficulty: form.difficulty, focus:[form.language, form.topic].filter(Boolean), description: form.topic || 'Complete the assessment task.', steps: form.steps.split('\n').filter(Boolean), required_format: form.language, grading_threshold:70, auto_reject:0, evaluation_nodes:[], job_id: form.job_id })
            });
            if (res.ok) { toast('Assessment created!'); closeModal(); fetchAll(); }
            else toast('Failed to create','danger');
        } catch { toast('Network error','danger'); }
        finally { setSubmitting(false); }
    };

    const submitAI = async () => {
        if (!form.job_id) return toast('Please select a job','danger');
        setSubmitting(true);
        toast('AI is generating your assessment...','info');
        try {
            const params = new URLSearchParams({ job_id: String(form.job_id), difficulty: form.difficulty, context: [form.topic, form.language !== 'python' ? `Language: ${form.language}` : ''].filter(Boolean).join('. ') });
            const res = await fetch(`${API}/assessments/generate?${params}`, { method:'POST' });
            if (res.ok) { toast('AI assessment generated!'); closeModal(); fetchAll(); }
            else { const e = await res.json(); toast(e.detail || 'AI generation failed','danger'); }
        } catch { toast('Network error','danger'); }
        finally { setSubmitting(false); }
    };

    const deleteAssessment = async (id: number) => {
        try {
            await fetch(`${API}/assessments/${id}`, { method:'DELETE' });
            toast('Deleted'); fetchAll();
        } catch { toast('Delete failed','danger'); }
    };

    const launchAssessment = async (a: Assessment, job: Job) => {
        toast('Sending assessment emails…', 'info');
        try {
            const res = await fetch(`${API}/emails/launch-assessment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    job_name: job.title,
                    assessment_details: {
                        assessment_id: String(a.id),
                        title: a.title,
                        description: a.description.replace(/#+/g,'').trim().slice(0,200),
                        duration: a.duration,
                        difficulty: a.difficulty,
                        focus_areas: a.focus
                    }
                })
            });
            const data = await res.json();
            if (res.ok && data.status === 'success') toast(data.message, 'success');
            else toast(data.message || 'Launch failed', 'danger');
        } catch { toast('Network error during launch', 'danger'); }
    };

    const scheduleAssessment = async (a: Assessment, job: Job) => {
        toast('Sending scheduling emails…', 'info');
        try {
            const res = await fetch(`${API}/emails/schedule-interview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    job_name: job.title,
                    assessment_id: String(a.id),
                    title: a.title
                })
            });
            const data = await res.json();
            if (res.ok && data.status === 'success') toast(data.message, 'success');
            else toast(data.detail || data.message || 'Schedule failed', 'danger');
        } catch { toast('Network error during scheduling', 'danger'); }
    };

    const grouped = jobs.map(j => ({
        job: j,
        items: assessments.filter(a => a.job_id === j.id && (
            !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.focus.some(f => f.toLowerCase().includes(search.toLowerCase()))
        ))
    })).filter(g => g.items.length > 0 || !search);

    const totalByDiff = (d: string) => assessments.filter(a => a.difficulty === d).length;

    return (
        <div className="flex-1 flex flex-col bg-base">
            {/* Toasts */}
            <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
                {toasts.map(t => {
                    const borderCls = t.type === 'danger' ? 'border-red-200' : t.type === 'info' ? 'border-blue-200' : 'border-emerald-200';
                    return (
                        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl bg-white min-w-[260px] pointer-events-auto ${borderCls}`}>
                            {t.type === 'danger' && <AlertCircle className="w-4 h-4 text-red-500"/>}
                            {t.type === 'info' && <Loader className="w-4 h-4 text-blue-500 animate-spin"/>}
                            {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500"/>}
                            <span className="text-sm font-semibold text-txt-primary">{t.msg}</span>
                        </div>
                    );
                })}
            </div>

            {/* Header */}
            <section className="px-8 pt-6 pb-0">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-txt-muted mb-1">
                            <button onClick={() => navigate('/dashboard')} className="hover:text-primary transition-colors">Overview</button>
                            <ChevronRight className="w-3 h-3"/>
                            <span className="text-txt-primary">Assessments</span>
                        </div>
                        <h2 className="text-2xl font-semibold tracking-tight text-txt-primary">Assessments</h2>
                        <p className="text-sm text-txt-muted mt-0.5">Create and manage technical challenges for candidates</p>
                    </div>
                    <button onClick={openModal} className="px-4 py-2 bg-primary hover:bg-primary-dark text-sm font-semibold rounded-lg transition-all flex items-center gap-2 text-white shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4"/> New Assessment
                    </button>
                </div>
            </section>

            {/* Stats */}
            <section className="px-8 pt-5 pb-0">
                <div className="grid grid-cols-4 gap-4">
                    {[
                        { label:'Total', val: assessments.length, color:'bg-blue-50 text-blue-600', icon: ClipboardCheck },
                        { label:'Expert', val: totalByDiff('Expert'), color:'bg-red-50 text-red-600', icon: Zap },
                        { label:'Intermediate', val: totalByDiff('Intermediate'), color:'bg-amber-50 text-amber-600', icon: Brain },
                        { label:'Easy', val: totalByDiff('Easy'), color:'bg-emerald-50 text-emerald-600', icon: CheckCircle2 },
                    ].map(s => (
                        <div key={s.label} className="bg-surface rounded-xl p-4 border border-bdr hover:border-primary/30 hover:-translate-y-0.5 transition-all shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center`}><s.icon className="w-[18px] h-[18px]"/></div>
                                <div><p className="text-xl font-semibold text-txt-primary">{loading ? '—' : s.val}</p><p className="text-xs text-txt-muted">{s.label}</p></div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Search */}
            <section className="px-8 pt-5 pb-0">
                <div className="relative max-w-sm">
                    <input type="text" placeholder="Search assessments..." value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full bg-white border border-bdr rounded-lg px-4 py-2.5 pl-10 text-sm outline-none focus:border-primary transition-all shadow-sm"/>
                    <Search className="w-4 h-4 text-txt-faint absolute left-3.5 top-1/2 -translate-y-1/2"/>
                </div>
            </section>

            {/* Content */}
            <section className="px-8 pt-6 pb-10 overflow-y-auto flex-1">
                {loading ? (
                    <div className="flex items-center justify-center py-24"><Loader className="w-8 h-8 text-primary/30 animate-spin"/></div>
                ) : assessments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center"><ClipboardCheck className="w-8 h-8 text-slate-200"/></div>
                        <p className="text-sm font-semibold text-txt-muted uppercase tracking-widest">No assessments yet</p>
                        <button onClick={openModal} className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"><Plus className="w-4 h-4 inline mr-1"/>Create First Assessment</button>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {grouped.map(({ job, items }) => (
                            <div key={job.id}>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-9 h-9 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg"><Briefcase className="w-4 h-4 text-white"/></div>
                                    <div>
                                        <h3 className="font-bold text-txt-primary">{job.title}</h3>
                                        <p className="text-[11px] text-txt-muted font-bold uppercase tracking-widest">{items.length} challenge{items.length !== 1 ? 's' : ''}</p>
                                    </div>
                                    <div className="h-px flex-1 bg-gradient-to-r from-slate-100 to-transparent"/>
                                    <button onClick={() => { setForm(f => ({...f, job_id: job.id})); openModal(); }} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"><Plus className="w-3 h-3"/>Add Challenge</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {items.map(a => {
                                        const FmtIcon = FORMAT_ICON[a.required_format] || FORMAT_ICON.default;
                                        return (
                                            <div key={a.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col p-6 relative group overflow-hidden">
                                                <div className="absolute -right-6 -top-6 w-20 h-20 bg-primary/5 rounded-full group-hover:bg-primary/10 transition-all"/>
                                                <div className="flex items-start justify-between mb-4">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${DIFF_COLOR[a.difficulty] || DIFF_COLOR.Intermediate}`}>{a.difficulty}</span>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => setDetail(a)} title="View details" className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"><Eye className="w-3.5 h-3.5"/></button>
                                                        <button onClick={() => deleteAssessment(a.id)} title="Delete" className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
                                                    </div>
                                                </div>
                                                <h4 className="font-bold text-txt-primary mb-2 group-hover:text-primary transition-colors line-clamp-2">{a.title}</h4>
                                                <p className="text-xs text-txt-muted leading-relaxed mb-4 line-clamp-3 flex-1">{a.description.replace(/#+/g,'').trim()}</p>
                                                <div className="flex flex-wrap gap-1.5 mb-5">
                                                    <span className="px-2 py-1 bg-primary/5 text-primary rounded-lg text-[10px] font-bold flex items-center gap-1"><FmtIcon className="w-3 h-3"/>{a.required_format}</span>
                                                    {a.focus.slice(0,2).map(f => <span key={f} className="px-2 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-bold border border-slate-100">{f}</span>)}
                                                </div>
                                                {/* Action buttons */}
                                                <div className="flex gap-2 mt-auto">
                                                    <button
                                                        onClick={() => launchAssessment(a, job)}
                                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm shadow-primary/20 active:scale-95"
                                                    >
                                                        <Send className="w-3.5 h-3.5"/>Launch
                                                    </button>
                                                    <button
                                                        onClick={() => scheduleAssessment(a, job)}
                                                        title="Send scheduling email with Google Calendar link"
                                                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-primary rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95"
                                                    >
                                                        <Calendar className="w-3.5 h-3.5"/>Schedule
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] text-txt-faint font-bold uppercase tracking-wider border-t border-slate-50 pt-3 mt-3">
                                                    <span>{a.duration}</span>
                                                    <span>{a.steps.length} step{a.steps.length !== 1 ? 's' : ''}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {/* Add card */}
                                    <button onClick={() => { setForm(f => ({...f, job_id: job.id})); openModal(); }}
                                        className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-slate-300 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all group min-h-[200px]">
                                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center mb-3 group-hover:rotate-90 transition-transform duration-500"><Plus className="w-6 h-6"/></div>
                                        <span className="font-bold uppercase tracking-widest text-[10px]">Add Challenge</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Detail Panel */}
            {detail && (
                <div className="fixed inset-0 z-[90] flex">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setDetail(null)}/>
                    <div className="absolute right-0 top-0 bottom-0 w-[500px] bg-white border-l border-bdr overflow-y-auto shadow-2xl flex flex-col animate-slide-in">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm">
                            <div><h3 className="font-bold text-txt-primary">{detail.title}</h3><p className="text-xs text-txt-muted">{detail.duration} · {detail.difficulty}</p></div>
                            <button onClick={() => setDetail(null)} className="p-2 rounded-xl hover:bg-elevated transition-all"><X className="w-5 h-5 text-txt-muted"/></button>
                        </div>
                        <div className="p-6 space-y-6 flex-1">
                            <div>
                                <p className="text-[10px] font-black text-txt-muted uppercase tracking-widest mb-2">Description</p>
                                <div className="bg-slate-50 rounded-2xl p-4 text-sm text-txt-secondary leading-relaxed whitespace-pre-wrap">{detail.description}</div>
                            </div>
                            {detail.steps.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-black text-txt-muted uppercase tracking-widest mb-3">Steps</p>
                                    <div className="space-y-2">
                                        {detail.steps.map((s,i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-100">
                                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center flex-shrink-0">{i+1}</span>
                                                <p className="text-sm text-txt-secondary">{s}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 rounded-2xl p-4"><p className="text-[10px] font-black text-txt-muted uppercase mb-1">Format</p><p className="text-sm font-bold text-txt-primary">{detail.required_format}</p></div>
                                <div className="bg-slate-50 rounded-2xl p-4"><p className="text-[10px] font-black text-txt-muted uppercase mb-1">Threshold</p><p className="text-sm font-bold text-txt-primary">{detail.grading_threshold}%</p></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {modal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-txt-primary tracking-tight">New Assessment</h2>
                                <p className="text-xs text-txt-muted mt-1 uppercase tracking-widest font-bold">
                                    {mode === 'pick' ? 'Choose creation mode' : mode === 'manual' ? 'Manual configuration' : 'AI-powered generation'}
                                </p>
                            </div>
                            <button onClick={closeModal} className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center transition-all"><X className="w-5 h-5 text-txt-muted"/></button>
                        </div>

                        <div className="p-8">
                            {mode === 'pick' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => setMode('manual')} className="p-6 rounded-2xl border-2 border-slate-100 hover:border-primary/30 bg-slate-50/50 hover:bg-white transition-all text-left flex flex-col gap-4 group hover:shadow-xl">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all shadow-sm border border-slate-100"><Edit3 className="w-5 h-5"/></div>
                                        <div>
                                            <h3 className="font-bold text-txt-primary mb-1">Manual Design</h3>
                                            <p className="text-xs text-slate-500 leading-relaxed">Define the title, steps, language, and topic yourself.</p>
                                        </div>
                                    </button>
                                    <button onClick={() => setMode('ai')} className="p-6 rounded-2xl bg-slate-900 text-white transition-all text-left flex flex-col gap-4 relative overflow-hidden group shadow-xl hover:shadow-2xl">
                                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/20 blur-xl rounded-full"/>
                                        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20"><Sparkles className="w-5 h-5 text-white"/></div>
                                        <div>
                                            <h3 className="font-bold mb-1">AI Generator</h3>
                                            <p className="text-xs text-slate-400 leading-relaxed">Let AI create a tailored assessment based on the job requirements.</p>
                                        </div>
                                    </button>
                                </div>
                            )}

                            {(mode === 'manual' || mode === 'ai') && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-txt-muted uppercase tracking-widest mb-1.5">Job Position *</label>
                                            <select value={form.job_id} onChange={e => setForm(f => ({...f, job_id: Number(e.target.value)}))} className="w-full border border-bdr rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary bg-white">
                                                <option value={0}>Select job…</option>
                                                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-txt-muted uppercase tracking-widest mb-1.5">Difficulty *</label>
                                            <select value={form.difficulty} onChange={e => setForm(f => ({...f, difficulty: e.target.value}))} className="w-full border border-bdr rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary bg-white">
                                                <option>Easy</option><option>Intermediate</option><option>Expert</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-txt-muted uppercase tracking-widest mb-1.5">Programming Language</label>
                                        <select value={form.language} onChange={e => setForm(f => ({...f, language: e.target.value}))} className="w-full border border-bdr rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary bg-white">
                                            {['python','javascript','typescript','java','sql','css','html','go','rust','text'].map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>

                                    {mode === 'ai' && (
                                        <div>
                                            <label className="block text-[10px] font-black text-txt-muted uppercase tracking-widest mb-1.5">Topic / Context <span className="text-slate-300 normal-case font-normal">(optional — AI will infer from job)</span></label>
                                            <input type="text" value={form.topic} onChange={e => setForm(f => ({...f, topic: e.target.value}))} placeholder="e.g. Build a REST API with authentication…" className="w-full border border-bdr rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary bg-white"/>
                                        </div>
                                    )}

                                    {mode === 'manual' && (
                                        <>
                                            <div>
                                                <label className="block text-[10px] font-black text-txt-muted uppercase tracking-widest mb-1.5">Assessment Title *</label>
                                                <input type="text" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="e.g. Build a React Data Table component" className="w-full border border-bdr rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary bg-white"/>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-txt-muted uppercase tracking-widest mb-1.5">Topic / Description</label>
                                                <input type="text" value={form.topic} onChange={e => setForm(f => ({...f, topic: e.target.value}))} placeholder="Brief description of the task…" className="w-full border border-bdr rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary bg-white"/>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-txt-muted uppercase tracking-widest mb-1.5">Steps <span className="text-slate-300 normal-case font-normal">(one per line)</span></label>
                                                <textarea rows={4} value={form.steps} onChange={e => setForm(f => ({...f, steps: e.target.value}))} placeholder={"Define the function signature\nImplement the core logic\nHandle edge cases\nWrite unit tests"} className="w-full border border-bdr rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary bg-white resize-none font-mono"/>
                                            </div>
                                        </>
                                    )}

                                    <div className="flex gap-3 pt-2">
                                        <button onClick={() => setMode('pick')} className="px-5 py-3 rounded-xl border border-bdr text-sm font-bold text-txt-muted hover:bg-elevated transition-all">← Back</button>
                                        <button onClick={mode === 'manual' ? submitManual : submitAI} disabled={submitting}
                                            className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-60 flex items-center justify-center gap-2">
                                            {submitting ? <><Loader className="w-4 h-4 animate-spin"/>{mode === 'ai' ? 'Generating…' : 'Creating…'}</> : mode === 'ai' ? <><Sparkles className="w-4 h-4"/>Generate with AI</> : <><Plus className="w-4 h-4"/>Create Assessment</>}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Assessments;
