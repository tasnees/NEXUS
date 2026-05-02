import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// --- Types ---
type CandidateStatus = 'shortlist' | 'reject' | 'hire';

interface CandidateData {
    id: number;
    name: string;
    email: string;
    phone: string;
    summary: string;
    skills: string[];
    experience: string[];
    education: string[];
    raw_text: string;
    applied_job?: string;
    drive_file_id?: string;
    assessment_results?: Array<{
        assessment_id: number;
        assessment_title?: string;
        grade: string;
        feedback: string;
        submitted_at: string;
    }>;
}

interface JobData {
    id: number;
    title: string;
    tags: string[];
    requirements: string | null;
    description: string | null;
}

interface SkillBar {
    label: string;
    score: number;
}

// --- Heuristic Utilities ---

const extractJobDimensions = (job: JobData | null): string[] => {
    if (!job) return ['Problem Solving', 'Code Efficiency', 'System Architecture'];
    const candidates: string[] = [];
    if (job.tags && job.tags.length > 0) {
        job.tags.filter(tag => tag && tag.trim().length > 0).slice(0, 3).forEach(tag => candidates.push(tag.trim()));
    }
    if (candidates.length < 3 && job.requirements) {
        const lines = job.requirements.split(/[\n,;]+/).map(l => l.trim()).filter(l => l.length > 3 && l.length < 40);
        lines.forEach(l => {
            if (candidates.length < 3 && !candidates.includes(l)) candidates.push(l);
        });
    }
    const defaults = ['Domain Knowledge', 'Technical Depth', 'Communication'];
    while (candidates.length < 3) candidates.push(defaults[candidates.length]);
    return candidates.slice(0, 3);
};

const scoreDimension = (label: string, candidate: CandidateData): number => {
    const text = (candidate.raw_text || '' + (candidate.skills || []).join(' ')).toLowerCase();
    const words = label.toLowerCase().split(/\s+/);
    const hits = words.filter(w => w.length > 2 && text.includes(w)).length;
    const baseFromSkills = Math.min(70, (candidate.skills?.length || 0) * 3);
    const baseFromExp   = Math.min(15, (candidate.experience?.length || 0) * 3);
    const keywordBonus  = Math.min(15, hits * 5);
    return Math.min(97, 55 + baseFromSkills * 0.15 + baseFromExp + keywordBonus);
};

const calculateHeuristics = (candidate: CandidateData, job: JobData | null) => {
    const skills = candidate.skills || [];
    const experience = candidate.experience || [];
    const dimensions = extractJobDimensions(job);
    const bars = dimensions.map(label => ({
        label,
        score: Math.round(scoreDimension(label, candidate)),
    }));
    const overall = Math.round(bars.reduce((sum, b) => sum + b.score, 0) / bars.length);
    return {
        overall,
        bars,
        strengths: [
            {
                icon: 'check_circle',
                iconColor: 'text-green-400',
                category: 'CV Match',
                description: skills.length > 5 ? 'High density of relevant skills identified.' : 'Solid technical foundation.',
            },
            {
                icon: 'auto_awesome',
                iconColor: 'text-blue-400',
                category: 'Experience Level',
                description: experience.length > 3 ? 'Substantial professional background.' : 'Early to mid-career profile.',
            }
        ]
    };
};

// --- Helper Components ---

const SkillProgressBar: React.FC<{ skill: SkillBar }> = ({ skill }) => (
    <div>
        <div className="flex justify-between text-[11px] font-black mb-1.5 uppercase tracking-tighter">
            <span className="text-slate-600">{skill.label}</span>
            <span className="text-primary">{skill.score}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
            <div
                className="bg-primary h-full rounded-full transition-all duration-700 ease-out shadow-lg shadow-primary/20"
                style={{ width: `${skill.score}%` }}
            />
        </div>
    </div>
);

const SubmissionModal: React.FC<{
    email: string;
    assessment_id: number;
    title: string;
    onClose: () => void;
}> = ({ email, assessment_id, title, onClose }) => {
    const [submission, setSubmission] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubmission = async () => {
            try {
                const res = await fetch(`http://localhost:8001/api/v1/submissions/by-candidate?email=${encodeURIComponent(email)}&assessment_id=${assessment_id}`);
                if (res.ok) setSubmission(await res.json());
            } catch (err) {
                console.error("Failed to fetch submission:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSubmission();
    }, [email, assessment_id]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1.5">Project Evaluation Node</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white hover:bg-slate-100 rounded-2xl shadow-sm transition-all border border-slate-100">
                        <span className="material-symbols-outlined text-slate-400">close</span>
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="font-bold text-slate-400 uppercase tracking-widest text-[11px]">Retrieving secure payload...</p>
                        </div>
                    ) : submission ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
                                    <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" />
                                        Verified & Graded
                                    </p>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">AI Performance</p>
                                    <p className="text-2xl font-black text-primary">{submission.grade || 'N/A'}</p>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Submission ID</p>
                                    <p className="text-sm font-bold text-slate-900 truncate">
                                        #{submission.id}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-tighter">
                                    <span className="material-symbols-outlined text-primary">terminal</span>
                                    Candidate Implementation
                                </h3>
                                <div className="bg-slate-900 text-slate-300 p-8 rounded-3xl font-mono text-[13px] whitespace-pre-wrap shadow-2xl border border-slate-800 min-h-[300px] leading-relaxed">
                                    {submission.answer}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-tighter">
                                    <span className="material-symbols-outlined text-primary">psychology</span>
                                    AI Heuristic Analysis
                                </h3>
                                <div className="bg-blue-50 border border-blue-100/50 p-8 rounded-3xl text-slate-700 text-sm italic leading-relaxed font-medium">
                                    "{submission.feedback}"
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                            <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">sentiment_dissatisfied</span>
                            <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">No submission data available.</p>
                        </div>
                    )}
                </div>
                
                <div className="p-8 border-t border-slate-100 flex justify-end bg-slate-50/30">
                    <button onClick={onClose} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-2xl transition-all active:scale-95 shadow-xl">
                        Acknowledge
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

const CandidateProfile: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<CandidateStatus>('shortlist');
    const [candidate, setCandidate] = useState<CandidateData | null>(null);
    const [jobData, setJobData] = useState<JobData | null>(null);
    const [loading, setLoading] = useState(true);

    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const [popupType, setPopupType] = useState<'success' | 'error'>('success');
    const [viewingSubmission, setViewingSubmission] = useState<{ id: number; title: string } | null>(null);

    // Toast state
    const [toasts, setToasts] = useState<Array<{id: number, msg: string, type: 'success' | 'danger' | 'info'}>>([]);

    const showToast = (msg: string, type: 'success' | 'danger' | 'info' = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    useEffect(() => {
        const fetchCandidate = async () => {
            try {
                const response = await fetch(`http://localhost:8001/api/v1/candidates/${id}`);
                if (!response.ok) throw new Error('Candidate not found');
                const data: CandidateData = await response.json();
                setCandidate(data);

                if (data.applied_job && data.applied_job !== 'Uncategorized') {
                    try {
                        const jobRes = await fetch(`http://localhost:8001/api/v1/jobs/by-title/${encodeURIComponent(data.applied_job)}`);
                        if (jobRes.ok) setJobData(await jobRes.json());
                    } catch {}
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCandidate();
    }, [id]);

    const statusOptions: { value: CandidateStatus; icon: string; label: string }[] = [
        { value: 'shortlist', icon: 'check_circle', label: 'Shortlist' },
        { value: 'reject', icon: 'cancel', label: 'Reject' },
        { value: 'hire', icon: 'stars', label: 'Hire' },
    ];

    const handleHire = async () => {
        if (!candidate) return;
        try {
            const candidateDetails = {
                name: candidate.name,
                email: candidate.email,
                phone: candidate.phone,
                location: 'Remote',
                skills: candidate.skills,
                score: 88,
                recommendation: 'Strong Hire'
            };
            await fetch('https://hook.eu1.make.com/tqqibszbd6xrovi349ye5sovpgyq4ees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(candidateDetails),
            });
            setPopupMessage(`Hire invitation dispatched to ${candidate.email}!`);
            setPopupType('success');
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 5000);
        } catch (error) {
            setPopupMessage(`Failed to send hire email.`);
            setPopupType('error');
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 5000);
        }
    };

    const handleReject = async () => {
        if (!candidate) return;
        try {
            const candidateDetails = {
                name: candidate.name,
                email: candidate.email,
                reason: 'Does not meet technical requirements for the role'
            };
            await fetch('https://hook.eu1.make.com/d7iuxyv2k5agixhzyg0gmgcsd6e25z8e', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(candidateDetails),
            });
            setPopupMessage(`Rejection notification sent to ${candidate.email}.`);
            setPopupType('success');
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 5000);
        } catch (error) {
            setPopupMessage(`Failed to send rejection email.`);
            setPopupType('error');
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 5000);
        }
    };

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
            <div className="w-16 h-16 border-[6px] border-slate-100 border-t-primary rounded-full animate-spin shadow-2xl" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Scanning Nexus Neural Database</p>
        </div>
    );
    
    if (!candidate) return <div className="h-screen flex items-center justify-center font-black uppercase tracking-widest text-slate-400">Candidate Out of Sync.</div>;

    const heuristics = calculateHeuristics(candidate, jobData);
    const avgGrade = candidate.assessment_results?.length 
        ? candidate.assessment_results.reduce((acc, r) => acc + (r.grade === 'A' ? 95 : r.grade === 'B' ? 85 : 75), 0) / candidate.assessment_results.length 
        : 0;

    return (
        <div className="flex-1 bg-[#F8FAFC] min-h-screen relative pb-20 overflow-x-hidden">
            {/* Pop-up Notification */}
            {showPopup && (
                <div className={`fixed top-8 right-8 z-[110] px-6 py-4 rounded-[1.5rem] shadow-2xl flex items-center gap-4 transition-all duration-500 animate-slide-in border-l-[6px] ${popupType === 'success' ? 'bg-white border-l-emerald-500 text-slate-900' : 'bg-white border-l-rose-500 text-slate-900'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${popupType === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                        <span className="material-symbols-outlined">{popupType === 'success' ? 'check_circle' : 'error'}</span>
                    </div>
                    <div>
                        <p className="font-black text-sm tracking-tight">{popupMessage}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Notification System</p>
                    </div>
                    <button onClick={() => setShowPopup(false)} className="ml-4 p-2 hover:bg-slate-100 rounded-full transition-all">
                        <span className="material-symbols-outlined text-sm text-slate-300">close</span>
                    </button>
                </div>
            )}
            
            {/* Submission Viewer Modal */}
            {viewingSubmission && (
                <SubmissionModal
                    email={candidate.email}
                    assessment_id={viewingSubmission.id}
                    title={viewingSubmission.title}
                    onClose={() => setViewingSubmission(null)}
                />
            )}
            
            {/* ─── Header ─── */}
            <div className="bg-white border-b border-slate-100 px-8 py-6 shadow-sm sticky top-0 z-40">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/candidates')} className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all group">
                            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{candidate.name}</h2>
                                <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID #{id}</span>
                            </div>
                            <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">briefcase</span>
                                Applying for <span className="text-primary">{candidate.applied_job}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                            {statusOptions.map((opt) => (
                                <label
                                    key={opt.value}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl cursor-pointer transition-all text-xs font-black uppercase tracking-widest ${
                                        status === opt.value
                                            ? 'bg-white shadow-xl text-primary opacity-100 border border-slate-100'
                                            : 'opacity-40 hover:opacity-100 text-slate-600'
                                    }`}
                                >
                                    <input className="hidden" type="radio" name="status" checked={status === opt.value} onChange={() => setStatus(opt.value)} />
                                    <span className="material-symbols-outlined text-sm">{opt.icon}</span>
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                        <button 
                            onClick={() => status === 'hire' ? handleHire() : status === 'reject' ? handleReject() : showToast("Please select a status", "info")}
                            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 hover:shadow-2xl transition-all shadow-xl active:scale-95"
                        >
                            <span className="material-symbols-outlined text-lg">bolt</span>
                            Execute Action
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── Main Content ─── */}
            <main className="max-w-[1600px] mx-auto p-8 grid grid-cols-12 gap-8">
                {/* ── Left Sidebar: Profile & Skills ── */}
                <aside className="col-span-12 lg:col-span-3 space-y-8">
                    {/* Identity Card */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-slate-900 to-slate-800 opacity-[0.03]" />
                        <div className="relative flex flex-col items-center pt-4">
                            <div className="w-36 h-36 rounded-[3rem] bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center border-4 border-white shadow-2xl mb-6 relative group-hover:scale-105 transition-transform duration-500">
                                <span className="material-symbols-outlined text-6xl text-primary opacity-40">person</span>
                                <div className="absolute inset-0 bg-primary/5 rounded-[3rem] animate-pulse" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 text-center mb-6">{candidate.name}</h3>
                            
                            <div className="w-full space-y-4 mb-8">
                                {[
                                    { icon: 'mail', val: candidate.email },
                                    { icon: 'call', val: candidate.phone || 'No Phone' },
                                    { icon: 'location_on', val: 'Remote / Global' },
                                    { icon: 'link', val: 'LinkedIn Profile', link: true }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 text-xs font-bold text-slate-500">
                                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-primary border border-slate-100">
                                            <span className="material-symbols-outlined text-sm">{item.icon}</span>
                                        </div>
                                        <span className={item.link ? 'text-primary underline cursor-pointer' : ''}>{item.val}</span>
                                    </div>
                                ))}
                            </div>

                            <a 
                                href={candidate.drive_file_id ? `https://drive.google.com/file/d/${candidate.drive_file_id}/view` : "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:shadow-2xl transition-all shadow-xl active:scale-95 mb-3"
                            >
                                <span className="material-symbols-outlined text-lg">description</span>
                                View in Drive
                            </a>
                            <button className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-50 transition-all">
                                <span className="material-symbols-outlined text-lg">download</span>
                                Local Archive
                            </button>
                        </div>
                    </div>

                    {/* Skill Tags */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Extracted Neural Skills</h4>
                        <div className="flex flex-wrap gap-2.5">
                            {candidate.skills?.map((s, i) => (
                                <span key={i} className="px-4 py-2 bg-primary/5 text-primary rounded-xl text-[11px] font-black border border-primary/10 hover:bg-primary/10 transition-all cursor-default">
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* ── Center Content: Hiring Pipeline & Scores ── */}
                <section className="col-span-12 lg:col-span-5 space-y-8">
                    {/* Hiring Progress Steps */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 overflow-hidden">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Hiring Pipeline Progress</h4>
                        <div className="space-y-10 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                            {/* Step 1 */}
                            <div className="flex gap-6 relative">
                                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 z-10">
                                    <span className="material-symbols-outlined text-sm">check</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h5 className="font-black text-slate-900 uppercase tracking-tighter text-sm">Step 1: Resume Screening</h5>
                                        <span className="text-xl font-black text-emerald-500">{heuristics.overall}%</span>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium leading-relaxed">Automatic heuristic analysis of CV match against job requirements.</p>
                                    <div className="mt-4 space-y-4">
                                        {heuristics.bars.map(s => <SkillProgressBar key={s.label} skill={s} />)}
                                    </div>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex gap-6 relative">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 shadow-lg ${candidate.assessment_results?.length ? 'bg-primary text-white shadow-primary/20' : 'bg-slate-100 text-slate-300'}`}>
                                    <span className="material-symbols-outlined text-sm">{candidate.assessment_results?.length ? 'check' : 'pending'}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h5 className="font-black text-slate-900 uppercase tracking-tighter text-sm">Step 2: Technical Assessment</h5>
                                        <span className={`text-xl font-black ${candidate.assessment_results?.length ? 'text-primary' : 'text-slate-200'}`}>
                                            {candidate.assessment_results?.length ? `${Math.round(avgGrade)}%` : 'Pending'}
                                        </span>
                                    </div>
                                    <div className="space-y-3 mt-4">
                                        {candidate.assessment_results?.map((res, i) => (
                                            <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-primary/30 transition-all cursor-pointer" onClick={() => setViewingSubmission({ id: res.assessment_id, title: res.assessment_title || 'Project' })}>
                                                <div className="flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-primary text-sm">verified</span>
                                                    <span className="text-xs font-bold text-slate-700">{res.assessment_title || 'Assessment'}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="px-2 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black">{res.grade}</span>
                                                    <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">visibility</span>
                                                </div>
                                            </div>
                                        ))}
                                        {!candidate.assessment_results?.length && (
                                            <p className="text-xs text-slate-400 font-medium italic">No assessment data received yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex gap-6 relative">
                                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center z-10 shadow-lg">
                                    <span className="material-symbols-outlined text-sm">video_call</span>
                                </div>
                                <div className="flex-1">
                                    <h5 className="font-black text-slate-900 uppercase tracking-tighter text-sm">Step 3: Personal Interview</h5>
                                    <p className="text-xs text-slate-400 font-medium leading-relaxed mt-2 italic">Not yet scheduled. Coordinate via G-Suite calendar.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Overview Summary */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 blur-[100px] -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-1000" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary">auto_awesome</span>
                                </div>
                                <h4 className="text-base font-black text-white uppercase tracking-widest">AI Resume Overview</h4>
                            </div>
                            <div className="space-y-6">
                                <p className="text-sm text-slate-300 leading-relaxed font-medium italic">
                                    "{candidate.summary || 'Resume synthesis complete. Candidate exhibits strong patterns in technical execution with a focus on scalable systems. High keyword alignment detected in core domains.'}"
                                </p>
                                <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
                                    <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Neural Strengths</h5>
                                    <ul className="space-y-3">
                                        {heuristics.strengths.map((s, i) => (
                                            <li key={i} className="flex gap-3 text-xs text-slate-300 font-medium">
                                                <span className={`material-symbols-outlined text-sm ${s.iconColor}`}>{s.icon}</span>
                                                {s.description}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Right Column: Experience & Details ── */}
                <section className="col-span-12 lg:col-span-4 space-y-8">
                    {/* Professional Experience */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Work Experience Timeline</h4>
                        <div className="space-y-6">
                            {candidate.experience?.length ? (
                                candidate.experience.map((exp, i) => (
                                    <div key={i} className="relative pl-8 before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:rounded-full before:bg-primary/40 before:shadow-lg">
                                        <p className="text-xs font-bold text-slate-900 mb-2 leading-relaxed">{exp}</p>
                                        <div className="h-px bg-slate-50 w-full" />
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10">
                                    <span className="material-symbols-outlined text-4xl text-slate-100 mb-2">history</span>
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No timeline segments identified</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Raw Neural Text */}
                    <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Raw CV Extraction</h4>
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-lg">JSON Source</span>
                        </div>
                        <div className="h-[300px] overflow-y-auto custom-scrollbar p-6 bg-white rounded-3xl border border-slate-100 shadow-inner">
                            <pre className="text-[10px] font-mono text-slate-500 whitespace-pre-wrap leading-loose">
                                {candidate.raw_text}
                            </pre>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="max-w-[1600px] mx-auto px-8 py-10 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NEXUS AI System v4.1.2 - Active Status</p>
                </div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">© 2026 HireSync AI Platform</p>
            </footer>

            {/* Toasts */}
            <div className="fixed top-4 right-4 z-[110] space-y-2 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className="toast flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl bg-white min-w-[280px] pointer-events-auto animate-slide-in">
                        <span className={`material-symbols-outlined ${t.type === 'success' ? 'text-emerald-500' : t.type === 'danger' ? 'text-rose-500' : 'text-blue-500'}`}>
                            {t.type === 'success' ? 'check_circle' : t.type === 'danger' ? 'error' : 'info'}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">{t.msg}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CandidateProfile;
