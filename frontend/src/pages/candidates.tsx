import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// --- Types ---
interface Candidate {
    id: number;
    name: string;
    role: string;
    avatar: string;
    aiScore: number;
    quizScore: number;
    quizBadge?: string;
    sentiment: 'highly_positive' | 'positive' | 'neutral' | 'negative';
    status: 'shortlisted' | 'interviewed' | 'new' | 'rejected';
}

interface FilterState {
    search: string;
    activeRoleFilter: string | null;
}

// --- Constants ---
const CANDIDATES_DATA: Candidate[] = [
    {
        id: 1,
        name: 'Alex Rivers',
        role: 'Senior React Developer',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD0M_Av47fsC0SjDJNL1SA8UuUSkzYELITSCaRo7fl0LEX8oKAAwGwmhPj1h6y05ccpxTByPFrXUyXAyWDJGpwLLc_u7AXIZpjClK9Uxs7aAmobmEIg5jbSFzuj30VHDALw8w8Z-Ux-73R64OhrDRRnh_LC41V7r1OGpIsb-oJmhdBRS2fsMacU2duxzwukC93gkpSQ_6W_dRCgTSssecMQaWS9n2E1vMJnbTcHqu1BKoCkjRSM7Vj6e3_KCfcZ6BVgKq6KRw43I5ch',
        aiScore: 92,
        quizScore: 98,
        quizBadge: 'Top 1%',
        sentiment: 'highly_positive',
        status: 'shortlisted',
    },
    {
        id: 2,
        name: 'Maya Sterling',
        role: 'Frontend Engineer',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPFOLYYFpq-0cB7vTq_Gl-xE2TVqPdpLtN0YHZfKTKntdI5gIORrlFSgqvSqnaKfpY1n1LheRw0g_Nqg4JcrGjrhA1k5yHISRg_iarN22WwesXtWYZySWTo_WWstM4Db3PJWItwuC_cOFVLzevjFCcMNWuRsS3Ff91dTo7-uWD3ohY6yLoha4n5rWJnOWtJ6QIsPFtHkXXMHshZDduvdhyvqPh82OmjbmhY2FMqmdx9ofW3ntDHYffJKQ2f8BmvVCdmYPPyAm8qFDz',
        aiScore: 84,
        quizScore: 88,
        sentiment: 'positive',
        status: 'interviewed',
    },
    {
        id: 3,
        name: 'Jordan Chen',
        role: 'Junior Frontend Dev',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3b0JIMjSVsq8_y_ZB3goyLdBIXruUsv4FqJMd7ju5cVxUdOI0rSdNpPOrMKUUBZDpV6rAIS3BRFOxEltLBubgNIfR3T99vwsqqYc89YxrGqRTvWGRYMTSxHgiGo-Rf_dX792vsrS6mPteHzAVztJOjA2pU_XPS20_v7U0Q77_CogQv6ZXdFz1WwIse0MhCPaCjg3g20nr0rVmoeQmuy2OcMGypVS0dAETXwwZOyXvAjtUZ5idl6zZcYdfFLGN3PtxCpjKyuOsPsiE',
        aiScore: 68,
        quizScore: 72,
        sentiment: 'neutral',
        status: 'new',
    },
    {
        id: 4,
        name: 'Elena Petrova',
        role: 'Fullstack Engineer',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJsYP3yhvwmpoTLm2pP2E8rVd026QY6dEDGEKted4R02NeDstvou302vYS1eNI7Y5fTKaHpnXS10Q-AVve2zjcFec3oUmkz7Ti8T80JKW9F5-m_zy1MAHHTNNmAyDtsARhHO_Qq7RoUhG2j6uu_628tVqrBMzGHUXxiRWYb5-_poguVTqK8cNoo715eDvfnbMxQL6htIaZ50F2qcvP7fzJj0ZidefLBJKsObPSFdNreXvJIMPovgc71eKAE1YBe8OzsirWS1sFdzRV',
        aiScore: 89,
        quizScore: 94,
        sentiment: 'highly_positive',
        status: 'interviewed',
    },
];

const SIDEBAR_NAV_ITEMS = [
    { icon: 'dashboard', label: 'Dashboard', href: '/dashboard', active: false },
    { icon: 'work', label: 'Jobs', href: '/jobs', active: false },
    { icon: 'group', label: 'Candidates', href: '/candidates', active: true },
    { icon: 'chat_bubble', label: 'Interviews', href: '#', active: false },
    { icon: 'analytics', label: 'Reports', href: '#', active: false },
];

// --- Helper Components ---

const AiScoreCircle: React.FC<{ score: number }> = ({ score }) => {
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                    <circle cx="24" cy="24" r={radius} fill="transparent" stroke="#e2e8f0" strokeWidth="4" />
                    <circle
                        cx="24"
                        cy="24"
                        r={radius}
                        fill="transparent"
                        stroke="#415A77"
                        strokeWidth="4"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                    />
                </svg>
                <span className="absolute text-xs font-extrabold text-primary">{score}</span>
            </div>
        </div>
    );
};

const QuizBar: React.FC<{ score: number; badge?: string }> = ({ score, badge }) => (
    <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-xs font-bold">
            <span>{score}%</span>
            {badge && (
                <span className="text-[10px] text-green-600 px-1.5 py-0.5 bg-green-100 rounded">
                    {badge}
                </span>
            )}
        </div>
        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${score}%` }} />
        </div>
    </div>
);

const SentimentBadge: React.FC<{ sentiment: Candidate['sentiment'] }> = ({ sentiment }) => {
    const config: Record<
        Candidate['sentiment'],
        { dotColor: string; bgColor: string; textColor: string; borderColor: string; icon: string; label: string; pulse?: boolean }
    > = {
        highly_positive: {
            dotColor: 'bg-green-500',
            bgColor: 'bg-green-50',
            textColor: 'text-green-700',
            borderColor: 'border-green-100',
            icon: 'sentiment_very_satisfied',
            label: 'Highly Positive',
            pulse: true,
        },
        positive: {
            dotColor: 'bg-blue-500',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-700',
            borderColor: 'border-blue-100',
            icon: 'sentiment_satisfied',
            label: 'Positive',
        },
        neutral: {
            dotColor: 'bg-gray-400',
            bgColor: 'bg-gray-50',
            textColor: 'text-gray-600',
            borderColor: 'border-gray-200',
            icon: 'sentiment_neutral',
            label: 'Neutral',
        },
        negative: {
            dotColor: 'bg-red-500',
            bgColor: 'bg-red-50',
            textColor: 'text-red-700',
            borderColor: 'border-red-100',
            icon: 'sentiment_dissatisfied',
            label: 'Negative',
        },
    };

    const c = config[sentiment];

    return (
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${c.dotColor} ${c.pulse ? 'animate-pulse' : ''}`} />
            <span
                className={`px-2.5 py-1 ${c.bgColor} ${c.textColor} rounded-lg text-xs font-bold border ${c.borderColor} flex items-center gap-1`}
            >
                <span className="material-symbols-outlined text-sm">{c.icon}</span>
                {c.label}
            </span>
        </div>
    );
};

const StatusBadge: React.FC<{ status: Candidate['status'] }> = ({ status }) => {
    const config: Record<Candidate['status'], { bg: string; text: string; border: string; label: string }> = {
        shortlisted: {
            bg: 'bg-primary/10',
            text: 'text-primary',
            border: 'border-primary/20',
            label: 'Shortlisted',
        },
        interviewed: {
            bg: 'bg-accent/10',
            text: 'text-accent',
            border: 'border-accent/20',
            label: 'Interviewed',
        },
        new: {
            bg: 'bg-green-500/10',
            text: 'text-green-600',
            border: 'border-green-200',
            label: 'New',
        },
        rejected: {
            bg: 'bg-red-500/10',
            text: 'text-red-600',
            border: 'border-red-200',
            label: 'Rejected',
        },
    };

    const c = config[status];

    return (
        <span className={`px-3 py-1 ${c.bg} ${c.text} rounded-lg text-xs font-extrabold tracking-wide uppercase border ${c.border}`}>
            {c.label}
        </span>
    );
};

// --- Main Component ---

const Candidates: React.FC = () => {
    const navigate = useNavigate();
    const [filters, setFilters] = useState<FilterState>({
        search: '',
        activeRoleFilter: 'Frontend Engineer',
    });

    const [currentPage, setCurrentPage] = useState<number>(1);

    const filteredCandidates = CANDIDATES_DATA.filter((c) => {
        const matchesSearch =
            !filters.search ||
            c.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            c.role.toLowerCase().includes(filters.search.toLowerCase());

        return matchesSearch;
    });

    const handleClearFilters = () => {
        setFilters({ search: '', activeRoleFilter: null });
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#f0f1f0]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {/* ─── Sidebar Navigation ─── */}
            <aside className="w-64 bg-white border-r border-accent/20 flex flex-col h-full shadow-sm">
                {/* Logo */}
                <div className="p-6 flex items-center gap-3">
                    <div className="bg-primary rounded-lg p-2 text-white shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-slate-800 text-lg font-extrabold leading-tight tracking-tight">NEXUS AI</h1>
                        <p className="text-accent text-xs font-medium uppercase tracking-wider">Hiring Portal</p>
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 mt-4">
                    <div className="px-3 space-y-1">
                        {SIDEBAR_NAV_ITEMS.map((item) => (
                            <Link
                                key={item.label}
                                to={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                                    item.active
                                        ? 'bg-primary/10 text-primary border-r-4 border-primary rounded-r-none font-bold'
                                        : 'text-accent hover:bg-primary/5 hover:text-primary font-semibold'
                                }`}
                            >
                                <span
                                    className="material-symbols-outlined"
                                    style={item.active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                                >
                                    {item.icon}
                                </span>
                                <span className="text-sm">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                </nav>

                {/* User Profile */}
                <div className="p-4 mt-auto border-t border-accent/10">
                    <div className="flex items-center gap-3 p-2 bg-[#f0f1f0] rounded-xl">
                        <img
                            alt="Sarah Jenkins"
                            className="w-10 h-10 rounded-full object-cover border-2 border-primary"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGVD4p7avS9GOqwSQhRNyy2g1wG-zM21NCA-VsEpQWAeTfq5DBb29lwDyX3kuChDDkeLEyV1sIk2WMpQzhoNptft4BlnF6pAzSdQwLf11h3i7R5IJLCXZpxZ2nlXd5Qc_nMcGTn6V-buhrGZ111DGqxWaBjl6b6aYdmqEfRE6AtQA7GFslPQXrOc-B6w53PzmwB2ABB55cKdEl6Y7yCoGbM-Bjuj9d1GrGmUE_VYDE7iz4vBKN2JbT6sgkg1rPYh5YScALZKafuN7Y"
                        />
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold truncate">Sarah Jenkins</span>
                            <span className="text-xs text-accent truncate">Lead Talent Partner</span>
                        </div>
                        <button className="ml-auto text-accent hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-lg">settings</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* ─── Main Content ─── */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-accent/10 px-8 py-4 flex items-center justify-between z-10 shadow-sm">
                    <div className="flex items-center gap-4 flex-1">
                        <h2 className="text-xl font-bold text-slate-800">Candidate Directory</h2>
                        <div className="h-6 w-[1px] bg-accent/20" />
                        <div className="relative w-full max-w-md">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-accent">
                                search
                            </span>
                            <input
                                className="w-full bg-[#f0f1f0] border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-accent/60 outline-none transition-all"
                                placeholder="Search by name, skill, or role..."
                                type="text"
                                value={filters.search}
                                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95">
                            <span className="material-symbols-outlined text-lg">compare_arrows</span>
                            Compare Candidates
                        </button>
                        <div className="h-8 w-[1px] bg-accent/20 mx-1" />
                        <button className="p-2 text-accent hover:bg-[#f0f1f0] rounded-lg transition-colors relative">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        </button>
                    </div>
                </header>

                {/* Filters Area */}
                <div className="bg-white px-8 py-3 border-b border-accent/10 flex items-center gap-3">
                    <span className="text-xs font-bold text-accent uppercase tracking-widest mr-2">Filters:</span>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-[#f0f1f0] hover:bg-accent/10 rounded-lg text-sm font-medium border border-accent/20 transition-colors">
                        All Roles <span className="material-symbols-outlined text-base">expand_more</span>
                    </button>
                    {filters.activeRoleFilter && (
                        <button
                            className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-bold border border-primary/20 transition-colors hover:bg-primary/20"
                            onClick={() => setFilters((prev) => ({ ...prev, activeRoleFilter: null }))}
                        >
                            {filters.activeRoleFilter}{' '}
                            <span className="material-symbols-outlined text-base">close</span>
                        </button>
                    )}
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-[#f0f1f0] hover:bg-accent/10 rounded-lg text-sm font-medium border border-accent/20 transition-colors">
                        Location: Hybrid <span className="material-symbols-outlined text-base">expand_more</span>
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-[#f0f1f0] hover:bg-accent/10 rounded-lg text-sm font-medium border border-accent/20 transition-colors">
                        Score: 80+ <span className="material-symbols-outlined text-base">expand_more</span>
                    </button>
                    <button
                        className="ml-auto text-primary text-xs font-bold uppercase hover:underline underline-offset-4 tracking-wider"
                        onClick={handleClearFilters}
                    >
                        Clear all
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-8 custom-scrollbar">
                    <div className="bg-white rounded-xl shadow-soft border border-white overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-accent/10">
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-accent">
                                        Candidate
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-accent text-center">
                                        AI Score
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-accent">
                                        Tech Quiz
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-accent">
                                        Interview Sentiment
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-accent">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-accent">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-accent/10">
                                {filteredCandidates.map((candidate) => (
                                    <tr
                                        key={candidate.id}
                                        className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                        onClick={() => navigate(`/candidate/${candidate.id}`)}
                                    >
                                        {/* Candidate Info */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    alt={candidate.name}
                                                    className="w-10 h-10 rounded-lg object-cover border border-accent/20 shadow-sm"
                                                    src={candidate.avatar}
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">
                                                        {candidate.name}
                                                    </span>
                                                    <span className="text-xs text-accent">{candidate.role}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* AI Score */}
                                        <td className="px-6 py-4">
                                            <AiScoreCircle score={candidate.aiScore} />
                                        </td>

                                        {/* Tech Quiz */}
                                        <td className="px-6 py-4">
                                            <QuizBar score={candidate.quizScore} badge={candidate.quizBadge} />
                                        </td>

                                        {/* Interview Sentiment */}
                                        <td className="px-6 py-4">
                                            <SentimentBadge sentiment={candidate.sentiment} />
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            <StatusBadge status={candidate.status} />
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4">
                                            <button className="text-accent hover:text-primary p-1 rounded-lg hover:bg-slate-100 transition-colors">
                                                <span className="material-symbols-outlined">more_vert</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="px-6 py-4 bg-slate-50/30 border-t border-accent/10 flex items-center justify-between">
                            <span className="text-sm text-accent">
                                Showing <span className="font-bold text-slate-800">1-{filteredCandidates.length}</span> of{' '}
                                <span className="font-bold text-slate-800">248</span> candidates
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-accent/20 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                >
                                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                                </button>
                                {[1, 2, 3].map((page) => (
                                    <button
                                        key={page}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                                            currentPage === page
                                                ? 'bg-primary text-white shadow-md shadow-primary/20'
                                                : 'hover:bg-slate-50'
                                        }`}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <span className="px-1 text-accent">...</span>
                                <button
                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-sm font-bold transition-colors"
                                    onClick={() => setCurrentPage(24)}
                                >
                                    24
                                </button>
                                <button
                                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-accent/20 bg-white hover:bg-slate-50 transition-colors"
                                    onClick={() => setCurrentPage((p) => p + 1)}
                                >
                                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Candidates;
