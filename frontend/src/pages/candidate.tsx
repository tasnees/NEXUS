import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

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
}

interface SkillBar {
    label: string;
    score: number;
}


interface StrengthItem {
    icon: string;
    iconColor: string;
    category: string;
    description: string;
}

// --- Constants (Still used as fallback/placeholders where AI data is missing) ---
const SKILL_BARS: SkillBar[] = [
    { label: 'Problem Solving', score: 92 },
    { label: 'Code Efficiency', score: 84 },
    { label: 'System Architecture', score: 78 },
];

const STRENGTHS: StrengthItem[] = [
    {
        icon: 'check_circle',
        iconColor: 'text-green-400',
        category: 'Key Strength',
        description: 'High technical proficiency',
    },
    {
        icon: 'warning',
        iconColor: 'text-yellow-400',
        category: 'Notice',
        description: 'No specific weaknesses noted.',
    },
];

// --- Helper Components ---

const CircularProgress: React.FC<{ score: number }> = ({ score }) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r={radius} fill="transparent" stroke="#cbd5e1" strokeWidth="10" />
                <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="#415A77"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                />
            </svg>
            <div className="absolute w-28 h-28 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
                <span className="text-3xl font-extrabold text-slate-800">
                    {score}
                    <small className="text-lg">%</small>
                </span>
                <span className="text-[10px] font-bold text-accent uppercase">Quiz Score</span>
            </div>
        </div>
    );
};

const SkillProgressBar: React.FC<{ skill: SkillBar }> = ({ skill }) => (
    <div>
        <div className="flex justify-between text-xs font-bold mb-1">
            <span>{skill.label}</span>
            <span className="text-primary">{skill.score}%</span>
        </div>
        <div className="w-full bg-accent/20 h-2 rounded-full overflow-hidden">
            <div
                className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${skill.score}%` }}
            />
        </div>
    </div>
);

// --- Main Component ---

const CandidateProfile: React.FC = () => {
    const { id } = useParams();
    const [status, setStatus] = useState<CandidateStatus>('shortlist');
    const [candidate, setCandidate] = useState<CandidateData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCandidate = async () => {
            try {
                const response = await fetch(`http://localhost:8001/api/v1/candidates/${id}`);
                if (!response.ok) throw new Error('Candidate not found');
                const data = await response.json();
                setCandidate(data);
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
            console.log('Webhook dispatched to Make.com via Hire');
        } catch (error) {
            console.error('Failed to dispatch Hire webhook:', error);
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
            console.log('Webhook dispatched to Make.com via Reject');
        } catch (error) {
            console.error('Failed to dispatch Reject webhook:', error);
        }
    };

    const handleConfirmation = () => {
        if (status === 'hire') {
            handleHire();
        } else if (status === 'reject') {
            handleReject();
        } else {
            console.log(`Candidate marked as: ${status}`);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center font-bold">Analysing Candidate Data...</div>;
    if (!candidate) return <div className="h-screen flex items-center justify-center font-bold">Candidate not found.</div>;

    const contactInfo = [
        { icon: 'location_on', text: 'Remote' },
        { icon: 'mail', text: candidate.email },
        { icon: 'call', text: candidate.phone || 'N/A' },
        { icon: 'link', text: 'LinkedIn Profile', isLink: true },
    ];

    return (
        <div className="flex-1 bg-off-white min-h-screen" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {/* ─── Local Header & Actions ─── */}
            <div className="bg-white border-b border-accent/20 px-6 py-4 shadow-sm flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Candidate Profile</h2>
                    <p className="text-sm text-accent">NEXUS ID: {id}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-off-white p-1 rounded-lg">
                        {statusOptions.map((opt) => (
                            <label
                                key={opt.value}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-all text-sm font-bold ${
                                    status === opt.value
                                        ? 'bg-white shadow-sm opacity-100'
                                        : 'opacity-60 hover:opacity-100'
                                }`}
                            >
                                <input
                                    className="hidden"
                                    type="radio"
                                    name="status"
                                    checked={status === opt.value}
                                    onChange={() => {
                                        setStatus(opt.value);
                                        if (opt.value === 'hire') {
                                            handleHire();
                                        } else if (opt.value === 'reject') {
                                            handleReject();
                                        }
                                    }}
                                />
                                <span className="material-symbols-outlined text-sm">{opt.icon}</span>
                                {opt.label}
                            </label>
                        ))}
                    </div>
                    <button 
                        onClick={handleConfirmation}
                        className="bg-primary text-white px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md active:scale-95">
                        <span className="material-symbols-outlined text-sm">bolt</span>
                        Send Confirmation
                    </button>
                </div>
            </div>

            {/* ─── Main Content Grid ─── */}
            <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-12 gap-6">
                {/* ── Left Column: Candidate Profile Card ── */}
                <aside className="col-span-12 lg:col-span-3 space-y-6">
                    {/* Profile Card */}
                    <div className="glass-panel rounded-xl p-6 shadow-sm overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary to-accent opacity-20" />
                        <div className="relative flex flex-col items-center pt-8">
                            <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg overflow-hidden mb-4 bg-slate-200 flex items-center justify-center">
                                <span className="material-symbols-outlined text-4xl text-slate-400">person</span>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 text-center">{candidate.name || "Anonymous"}</h2>
                            <p className="text-accent font-medium mb-4 text-center">Applicant</p>

                            {/* Contact Info */}
                            <div className="w-full space-y-3 mb-6">
                                {contactInfo.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 text-sm text-slate-800/80">
                                        <span className="material-symbols-outlined text-primary">{item.icon}</span>
                                        <span className={item.isLink ? 'underline cursor-pointer hover:text-primary transition-colors' : ''}>
                                            {item.text}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full bg-primary text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-[0.98]">
                                <span className="material-symbols-outlined">download</span>
                                Download CV
                            </button>
                        </div>
                    </div>

                    {/* Core Competencies */}
                    <div className="glass-panel rounded-xl p-5 shadow-sm">
                        <h3 className="font-bold text-sm uppercase tracking-wider text-accent mb-4">
                            Extracted Skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {candidate.skills && candidate.skills.length > 0 ? (
                                candidate.skills.map((skill, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1 bg-white border border-accent/20 rounded-full text-xs font-bold hover:border-primary hover:text-primary transition-colors cursor-default"
                                    >
                                        {skill}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs italic opacity-50">No skills identified.</span>
                            )}
                        </div>
                    </div>
                </aside>

                {/* ── Center Column: AI Assessment Breakdown ── */}
                <section className="col-span-12 lg:col-span-5 space-y-6">
                    {/* Phase 1: Technical Quiz */}
                    <div className="glass-panel rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold">Phase 1: Technical Assessment</h3>
                                <p className="text-sm text-accent">Heuristic Analysis Results</p>
                            </div>
                            <span className="bg-green-100 text-green-700 text-xs font-black px-2 py-1 rounded">
                                ANALYSED
                            </span>
                        </div>
                        <div className="flex items-center gap-10">
                            <CircularProgress score={75} />
                            <div className="flex-1 space-y-4">
                                {SKILL_BARS.map((skill) => (
                                    <SkillProgressBar key={skill.label} skill={skill} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Summary / About */}
                    <div className="glass-panel rounded-xl p-6 shadow-sm">
                        <h3 className="text-xl font-bold mb-4">Professional Summary</h3>
                        <p className="text-sm text-slate-700 leading-relaxed">
                            {candidate.summary || "No summary provided in resume."}
                        </p>
                    </div>

                    {/* Work Experience */}
                    <div className="glass-panel rounded-xl p-6 shadow-sm">
                        <h3 className="text-xl font-bold mb-4">Experience</h3>
                        <div className="space-y-4">
                            {candidate.experience && candidate.experience.length > 0 ? (
                                candidate.experience.map((exp, idx) => (
                                    <div key={idx} className="border-l-2 border-primary pl-4 py-1">
                                        <p className="text-sm whitespace-pre-wrap">{exp}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm italic opacity-50">No experience blocks identified.</p>
                            )}
                        </div>
                    </div>
                </section>

                {/* ── Right Column: Document & Recommendation ── */}
                <section className="col-span-12 lg:col-span-4 space-y-6">
                    {/* CV Preview/Raw Text */}
                    <div className="glass-panel rounded-xl shadow-sm flex flex-col h-[400px]">
                        <div className="p-4 border-b border-accent/10 flex items-center justify-between bg-white/30">
                            <h3 className="font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">description</span>
                                Raw Content
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar">
                            <pre className="text-[10px] font-mono whitespace-pre-wrap text-slate-800 leading-tight">
                                {candidate.raw_text}
                            </pre>
                        </div>
                    </div>

                    {/* AI Recommendation (Phase 3) */}
                    <div className="bg-primary rounded-xl p-6 shadow-xl text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                                <span className="material-symbols-outlined text-white">auto_awesome</span>
                            </div>
                            <h3 className="text-lg font-bold">Heuristic Verdict</h3>
                        </div>

                        <p className="text-sm text-white/90 leading-relaxed mb-6 italic">
                            "Automatic extraction successful. Candidate processed from Google Drive repository."
                        </p>

                        <div className="space-y-4">
                            {STRENGTHS.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <span className={`material-symbols-outlined ${item.iconColor} text-sm mt-1`}>
                                        {item.icon}
                                    </span>
                                    <div>
                                        <p className="text-xs font-bold uppercase text-white/60">{item.category}</p>
                                        <p className="text-sm font-semibold">{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* ─── Footer Meta ─── */}
            <footer className="max-w-[1600px] mx-auto px-6 py-8 border-t border-accent/10 flex justify-between items-center opacity-50">
                <p className="text-xs font-bold text-black font-extrabold uppercase">{candidate.name} - Case File #{id}</p>
                <p className="text-xs">Processing via NEXUS AI v2.4.0-stable</p>
            </footer>
        </div>
    );
};

export default CandidateProfile;

