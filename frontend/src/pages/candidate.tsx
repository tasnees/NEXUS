import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// --- Types ---
type CandidateStatus = 'shortlist' | 'reject' | 'hire';

interface SkillBar {
    label: string;
    score: number;
}

interface SoftSkillMetric {
    label: string;
    value: string;
}

interface SentimentBar {
    height: string;
}

interface StrengthItem {
    icon: string;
    iconColor: string;
    category: string;
    description: string;
}

// --- Constants ---
const SKILL_BARS: SkillBar[] = [
    { label: 'Problem Solving', score: 92 },
    { label: 'Code Efficiency', score: 84 },
    { label: 'System Architecture', score: 78 },
];

const SOFT_SKILL_METRICS: SoftSkillMetric[] = [
    { label: 'Confidence', value: 'High' },
    { label: 'Clarity', value: '8.4/10' },
    { label: 'Engagement', value: 'Active' },
];

const SENTIMENT_BARS: SentimentBar[] = [
    { height: '60%' },
    { height: '85%' },
    { height: '45%' },
    { height: '75%' },
    { height: '95%' },
    { height: '65%' },
    { height: '80%' },
];

const COMPETENCIES: string[] = ['React.js', 'Node.js', 'PostgreSQL', 'AWS Lambda', 'Docker', 'Python'];

const STRENGTHS: StrengthItem[] = [
    {
        icon: 'check_circle',
        iconColor: 'text-green-400',
        category: 'Key Strength',
        description: 'High-load system design efficiency',
    },
    {
        icon: 'warning',
        iconColor: 'text-yellow-400',
        category: 'Notice',
        description: 'Limited experience with legacy Java',
    },
];

const CONTACT_INFO = [
    { icon: 'location_on', text: 'Austin, TX (Remote)' },
    { icon: 'mail', text: 'a.wright@devmail.com' },
    { icon: 'call', text: '+1 (512) 555-0198' },
    { icon: 'link', text: 'linkedin.com/in/awright', isLink: true },
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
    const [status, setStatus] = useState<CandidateStatus>('shortlist');

    const statusOptions: { value: CandidateStatus; icon: string; label: string }[] = [
        { value: 'shortlist', icon: 'check_circle', label: 'Shortlist' },
        { value: 'reject', icon: 'cancel', label: 'Reject' },
        { value: 'hire', icon: 'stars', label: 'Hire' },
    ];

    return (
        <div className="bg-off-white min-h-screen" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {/* ─── Top Navigation Bar ─── */}
            <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-accent/20 px-6 py-3">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    {/* Left: Logo + Nav */}
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-3xl">deployed_code</span>
                            <h1 className="text-xl font-extrabold tracking-tight">
                                NEXUS <span className="text-primary">AI</span>
                            </h1>
                        </div>
                        <nav className="hidden md:flex items-center gap-6">
                            <Link className="text-sm font-semibold hover:text-primary transition-colors" to="/dashboard">
                                Dashboard
                            </Link>
                            <Link
                                className="text-sm font-semibold border-b-2 border-primary text-primary pb-1"
                                to="/candidates"
                            >
                                Candidates
                            </Link>
                            <Link className="text-sm font-semibold hover:text-primary transition-colors" to="/jobs">
                                Job Postings
                            </Link>
                            <Link className="text-sm font-semibold hover:text-primary transition-colors" to="#">
                                Analytics
                            </Link>
                        </nav>
                    </div>

                    {/* Right: Status Toggle + Action + Avatar */}
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
                                        onChange={() => setStatus(opt.value)}
                                    />
                                    <span className="material-symbols-outlined text-sm">{opt.icon}</span>
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                        <button className="bg-primary text-white px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md active:scale-95">
                            <span className="material-symbols-outlined text-sm">bolt</span>
                            Send Confirmation
                        </button>
                        <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center overflow-hidden">
                            <img
                                className="w-full h-full object-cover"
                                alt="HR Manager Profile Picture"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGHLVm7HkdDxnyypSyhYQ5mhQmGQY3HotfkNCbxleQraHnD-RSavBlWsnMxfk4cEtfqSfrOyaZklTbyJcosdg10k6PmBPT9dMHVL0pRoUf3SJcqKyH1u2Qimm43mYZdPA4L1b04aTYWEaueLO6VuDUe41Q_Gszyi5QLo_xPb1GQYNygA7mRarXO-kGccRWzqwpqrXvL_sfG0ykwaOAUAQF8aoEzSjnUK27UkDpJveI3DofWFNYNv4YILYCGnobojtTqC0m0I9xm4ih"
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* ─── Main Content Grid ─── */}
            <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-12 gap-6">
                {/* ── Left Column: Candidate Profile Card ── */}
                <aside className="col-span-12 lg:col-span-3 space-y-6">
                    {/* Profile Card */}
                    <div className="glass-panel rounded-xl p-6 shadow-sm overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary to-accent opacity-20" />
                        <div className="relative flex flex-col items-center pt-8">
                            <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg overflow-hidden mb-4">
                                <img
                                    className="w-full h-full object-cover"
                                    alt="Alexander Wright professional portrait"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZSPXdEaAkTah2DmsGxEIye_gEfrNiqPmJZBoV6E7rUrp4dYfoCVa-7uAsfbYpnB_7aYCSCoaW1dh5cGfDkRuF1lbvf2z4NAYgJOdY6s6Lrsz4RLvq7JRBeApHHe7wiAWtFx7E9E6lb2mQ8NMxfkPIRReU6ypOQ5jSULPJMreyYtwJYz2hyCzujuaiHgiAczT_1pF2jXWUGFmJNDYypB_cQC4130207cJOBGmZZKK0AsBQo6KhRrkHpC8a26k-eM43CSyHLfFhxaeh"
                                />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">Alexander Wright</h2>
                            <p className="text-accent font-medium mb-4">Senior Software Engineer</p>

                            {/* Contact Info */}
                            <div className="w-full space-y-3 mb-6">
                                {CONTACT_INFO.map((item, idx) => (
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
                            Core Competencies
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {COMPETENCIES.map((skill) => (
                                <span
                                    key={skill}
                                    className="px-3 py-1 bg-white border border-accent/20 rounded-full text-xs font-bold hover:border-primary hover:text-primary transition-colors cursor-default"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* ── Center Column: AI Assessment Breakdown ── */}
                <section className="col-span-12 lg:col-span-5 space-y-6">
                    {/* Phase 1: Technical Quiz */}
                    <div className="glass-panel rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold">Phase 1: Technical Mastery</h3>
                                <p className="text-sm text-accent">Automated Skill Verification</p>
                            </div>
                            <span className="bg-green-100 text-green-700 text-xs font-black px-2 py-1 rounded">
                                VERIFIED
                            </span>
                        </div>
                        <div className="flex items-center gap-10">
                            <CircularProgress score={88} />
                            <div className="flex-1 space-y-4">
                                {SKILL_BARS.map((skill) => (
                                    <SkillProgressBar key={skill.label} skill={skill} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Phase 2: Sentiment Analysis */}
                    <div className="glass-panel rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold">Phase 2: Soft Skills AI</h3>
                                <p className="text-sm text-accent">Interview Sentiment &amp; Persona Analysis</p>
                            </div>
                            <span className="material-symbols-outlined text-primary text-3xl">psychology</span>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                            {SOFT_SKILL_METRICS.map((metric) => (
                                <div
                                    key={metric.label}
                                    className="bg-white/50 p-3 rounded-lg border border-accent/10"
                                >
                                    <p className="text-[10px] font-bold text-accent uppercase">{metric.label}</p>
                                    <p className="text-lg font-extrabold text-primary">{metric.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Sentiment Bar Chart */}
                        <div className="h-48 w-full bg-white/40 rounded-lg flex items-end justify-between px-6 py-4 relative group">
                            <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                <span className="material-symbols-outlined text-[100px]">show_chart</span>
                            </div>
                            {SENTIMENT_BARS.map((bar, idx) => (
                                <div
                                    key={idx}
                                    className="w-8 bg-primary/40 rounded-t hover:bg-primary transition-all duration-200 cursor-pointer"
                                    style={{ height: bar.height }}
                                />
                            ))}
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-accent mt-2 px-1">
                            <span>Opening</span>
                            <span>Technical Dive</span>
                            <span>Experience Recap</span>
                            <span>Closing</span>
                        </div>
                    </div>
                </section>

                {/* ── Right Column: Document & Recommendation ── */}
                <section className="col-span-12 lg:col-span-4 space-y-6">
                    {/* CV Preview */}
                    <div className="glass-panel rounded-xl shadow-sm flex flex-col h-[400px]">
                        <div className="p-4 border-b border-accent/10 flex items-center justify-between bg-white/30">
                            <h3 className="font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">description</span>
                                Curriculum Vitae
                            </h3>
                            <div className="flex gap-2">
                                <button className="w-6 h-6 flex items-center justify-center rounded bg-accent/10 text-accent hover:bg-primary hover:text-white transition-all">
                                    <span className="material-symbols-outlined text-xs">zoom_in</span>
                                </button>
                                <button className="w-6 h-6 flex items-center justify-center rounded bg-accent/10 text-accent hover:bg-primary hover:text-white transition-all">
                                    <span className="material-symbols-outlined text-xs">fullscreen</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar">
                            <div className="bg-white shadow-sm border border-accent/10 p-8 space-y-4 min-h-[600px]">
                                {/* CV Skeleton Placeholder */}
                                <div className="h-4 bg-primary/20 w-1/2 rounded" />
                                <div className="h-2 bg-slate-200 w-full rounded" />
                                <div className="h-2 bg-slate-200 w-full rounded" />
                                <div className="h-2 bg-slate-200 w-3/4 rounded" />
                                <div className="pt-6 space-y-2">
                                    <div className="h-3 bg-accent/30 w-1/4 rounded" />
                                    <div className="h-2 bg-slate-200 w-full rounded" />
                                    <div className="h-2 bg-slate-200 w-full rounded" />
                                </div>
                                <div className="pt-6 space-y-2">
                                    <div className="h-3 bg-accent/30 w-1/4 rounded" />
                                    <div className="h-2 bg-slate-200 w-full rounded" />
                                    <div className="h-2 bg-slate-200 w-full rounded" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Recommendation (Phase 3) */}
                    <div className="bg-primary rounded-xl p-6 shadow-xl text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                                <span className="material-symbols-outlined text-white">auto_awesome</span>
                            </div>
                            <h3 className="text-lg font-bold">Phase 3: AI Verdict</h3>
                        </div>

                        <p className="text-sm text-white/90 leading-relaxed mb-6 italic">
                            "Alexander demonstrates exceptional architectural knowledge and a calm, articulate
                            communication style. His technical score is in the top 2% of candidates this month."
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

                        <div className="mt-8 pt-6 border-t border-white/20 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase text-white/60">Recommendation</p>
                                <p className="text-xl font-bold">Strong Hire</p>
                            </div>
                            <div className="w-12 h-12 bg-white text-primary rounded-full flex items-center justify-center font-extrabold text-lg shadow-inner">
                                A+
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* ─── Footer Meta ─── */}
            <footer className="max-w-[1600px] mx-auto px-6 py-8 border-t border-accent/10 flex justify-between items-center opacity-50">
                <p className="text-xs font-bold">Workflow Phase: 5/5 (Decision Engine)</p>
                <p className="text-xs">Processing via NEXUS AI v2.4.0-stable</p>
            </footer>
        </div>
    );
};

export default CandidateProfile;
