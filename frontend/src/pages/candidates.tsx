import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

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
    const [searchParams] = useSearchParams();
    const jobFilter = searchParams.get('job');
    
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<FilterState>({
        search: '',
        activeRoleFilter: jobFilter,
    });

    useEffect(() => {
        // ... (rest of useEffect)
        const fetchCandidates = async () => {
            try {
                const response = await fetch('http://localhost:8001/api/v1/candidates/');
                if (!response.ok) throw new Error('Failed to fetch');
                const data = await response.json();
                
                // Map DB schema to UI schema
                const mapped: Candidate[] = data.map((c: any) => ({
                    id: c.id,
                    name: c.name || "Anonymous",
                    role: c.skills?.[0] || "Applicant", // Use first skill as role for now
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || 'A')}&background=random`,
                    aiScore: 70 + (c.skills?.length || 0) * 2, // Heuristic score
                    quizScore: 75,
                    sentiment: 'positive' as const,
                    status: 'new' as const,
                }));
                
                setCandidates(mapped);
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCandidates();
    }, []);

    const [currentPage, setCurrentPage] = useState<number>(1);

    const filteredCandidates = candidates.filter((c) => {
        const matchesSearch =
            !filters.search ||
            c.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            c.role.toLowerCase().includes(filters.search.toLowerCase());

        const matchesRole =
            !filters.activeRoleFilter ||
            c.role.toLowerCase().includes(filters.activeRoleFilter.toLowerCase()) ||
            filters.activeRoleFilter.toLowerCase().includes(c.role.toLowerCase());

        return matchesSearch && matchesRole;
    });

    const handleClearFilters = () => {
        setFilters({ search: '', activeRoleFilter: null });
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#f0f1f0]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {/* ─── Main Content ─── */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header Actions */}
                <div className="bg-white border-b border-accent/10 px-8 py-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4 flex-1">
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
                </div>

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
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center font-bold text-accent">
                                            Loading Candidates...
                                        </td>
                                    </tr>
                                ) : filteredCandidates.map((candidate) => (
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
                                <span className="font-bold text-slate-800">{candidates.length}</span> candidates
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
