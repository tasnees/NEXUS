import React from 'react';
import { Link } from 'react-router-dom';

// --- Types ---
interface SentimentBadge {
    label: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    icon: string;
}

interface TranscriptMessage {
    id: number;
    sender: 'ai' | 'candidate';
    text: string;
    timestamp: string;
    senderName: string;
    badges?: SentimentBadge[];
}

interface SoftSkillStat {
    label: string;
    value: string;
}

// --- Constants ---
const CANDIDATE_AVATAR =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCWhZXJeJR5qxOs7a7Z-MxIST0FA-G19F6O67JCkJHDyyZxzEeq2youpHYdWbbu3urguIlK6cfUsc9GlaZhILROBwJ97EdGBZ9ecuQmhO8vYQH268aWAympFWPoYd0BljLMMHJWpxxPLTwOpZis49Fh9QSlxgxqlK_ZVJvLT97brJqkIRw5QZFqbil7-z-51_Ecc5rnahhnzKihSJMNP3W6EOOWNYdrc0OA7YbTzBgtBJS3KeF27h31fJ2C72G250nQCVFPf-bDtAgT';

const CANDIDATE_AVATAR_SMALL_1 =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBAOStFU7tg0uia1R-m1gwyTj_sGWHMHR3NjL1XkNBoutDLSLxoOvJGRPgplunL2n-35DOzcqkzPe_QdOJYxbEVX7PrsmZFtwNrqm0GeVN8372Mqd4vcnz2yJ2Y9GqxeqhQTPJwaRdfRmxkLKqBrsOmTdhggrolAAacg6sK6bYvWRge5e9xTZ678X7xvzNBNz3Jgdb3xrbfILSfU-NjZ7dgWcdN-i9ZuJNpmvUMi5oAOrL6Avx3Lnnrdn6TcdBYCOhViybTBqIATNcx';

const CANDIDATE_AVATAR_SMALL_2 =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA4hp564oMK22XSOKSU_UfwM9ghOV6f8NEjoXq9fbKa5miLwtYtmpX29xaGu6tfrjQuJIBpR_8Qr0pyAKDihUwpi24zD9GnT3l2kmW3RRxGch8vVMaxT_KjaQ7eRlpofEhTFtzTQ3EglzuLieNrszN1PbZDLBprDUcrIFDz3UJwjsg_2oDyUNoHSiWoO3E4RbqEtaxWUsnKh8WWXCTxHhuFm0nV10TeS7Oll2Ts9IQyKewtcHnFw9ZL5G-Xx1iq-mKAw1WMnZAPnfc7';

const HR_AVATAR =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBnIw3aP8yfX9JekrlUq6ns7FMY8WA3bAdFvLObAVCWHIQfYCtkQtyMc7lJDorlDWcNm43H_dzOVQODa37WzvQBZNFoz2s1spjPhCjFHkbuLLKAyIhI1MZxK06i2Lj896pXREBOKotZXHChoAKdiVJIDd3irqhkv-eNRnaV8cGnf1dryJ23IwgCLVeJSHHR9ae12LR7yozraofYh2Lbv4WgdMjeYb2UcvanfVLJjgfnW-k6kVy6UziOyPiSSIhBWDQX0GMC0kG5aJYC';

const TRANSCRIPT_MESSAGES: TranscriptMessage[] = [
    {
        id: 1,
        sender: 'ai',
        text: "Hello Alex, it's great to have you. Let's start with your approach to system scalability. Can you describe a time you had to handle a sudden 10x traffic spike?",
        timestamp: '10:02 AM',
        senderName: 'AI Recruiter Sarah',
    },
    {
        id: 2,
        sender: 'candidate',
        text: "In my last role at TechScale, we faced a viral marketing spike. I immediately implemented a Redis caching layer for the hot-path endpoints and configured auto-scaling groups on AWS. It wasn't just about throwing hardware at it; we had to refactor the database queries to avoid locks.",
        timestamp: '10:04 AM',
        senderName: 'Alex Morgan',
        badges: [
            {
                label: 'Confident',
                bgColor: 'bg-green-100',
                textColor: 'text-green-700',
                borderColor: 'border-green-200',
                icon: 'verified',
            },
            {
                label: 'Technical',
                bgColor: 'bg-blue-100',
                textColor: 'text-blue-700',
                borderColor: 'border-blue-200',
                icon: 'code',
            },
        ],
    },
    {
        id: 3,
        sender: 'ai',
        text: "Impressive. How do you manage team disagreements regarding architectural choices, specifically when your proposal isn't the favored one?",
        timestamp: '10:06 AM',
        senderName: 'AI Recruiter Sarah',
    },
    {
        id: 4,
        sender: 'candidate',
        text: "Well, uh... I usually try to present data. But if the team feels strongly, I'll follow the consensus. I believe in 'disagree and commit' as long as the risks are documented and we have a path for a pivot if needed.",
        timestamp: '10:07 AM',
        senderName: 'Alex Morgan',
        badges: [
            {
                label: 'Hesitant',
                bgColor: 'bg-amber-100',
                textColor: 'text-amber-700',
                borderColor: 'border-amber-200',
                icon: 'error',
            },
            {
                label: 'Professional',
                bgColor: 'bg-purple-100',
                textColor: 'text-purple-700',
                borderColor: 'border-purple-200',
                icon: 'groups',
            },
        ],
    },
];

const SOFT_SKILL_STATS: SoftSkillStat[] = [
    { label: 'Communication', value: '92%' },
    { label: 'Leadership', value: '74%' },
];

// --- Helper Components ---

const AiMessage: React.FC<{ message: TranscriptMessage }> = ({ message }) => (
    <div className="flex gap-4 max-w-[85%]">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-sm">smart_toy</span>
        </div>
        <div className="bg-white p-4 rounded-xl rounded-tl-none border border-primary/10 shadow-sm">
            <p className="text-sm leading-relaxed text-slate-800/80 font-medium">{message.text}</p>
            <span className="text-[10px] text-slate-800/30 font-bold block mt-2">
                {message.timestamp} • {message.senderName}
            </span>
        </div>
    </div>
);

const CandidateMessage: React.FC<{ message: TranscriptMessage; avatarSrc: string }> = ({
    message,
    avatarSrc,
}) => (
    <div className="flex flex-col items-end gap-2">
        <div className="flex gap-4 max-w-[85%] justify-end">
            <div className="flex flex-col items-end gap-2 order-1">
                <div className="bg-off-white p-4 rounded-xl rounded-tr-none border border-primary/10 shadow-sm">
                    <p className="text-sm leading-relaxed text-slate-800 font-semibold">{message.text}</p>
                    <span className="text-[10px] text-slate-800/40 font-bold block mt-2 text-right">
                        {message.timestamp} • {message.senderName}
                    </span>
                </div>
                {message.badges && (
                    <div className="flex gap-2">
                        {message.badges.map((badge) => (
                            <span
                                key={badge.label}
                                className={`px-3 py-1 ${badge.bgColor} ${badge.textColor} text-[10px] font-black rounded-full flex items-center gap-1 border ${badge.borderColor} uppercase tracking-tighter`}
                            >
                                <span className="material-symbols-outlined text-[12px]">{badge.icon}</span>
                                {badge.label}
                            </span>
                        ))}
                    </div>
                )}
            </div>
            <div className="w-8 h-8 rounded-full bg-off-white overflow-hidden shrink-0 border border-primary/20 order-2">
                <img className="w-full h-full object-cover" alt="Candidate Avatar" src={avatarSrc} />
            </div>
        </div>
    </div>
);

const InterviewScoreCircle: React.FC<{ score: number }> = ({ score }) => (
    <div className="flex flex-col items-center">
        <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                    className="text-off-white"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="100, 100"
                    strokeWidth="3"
                />
                <path
                    className="text-primary"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray={`${score}, 100`}
                    strokeLinecap="round"
                    strokeWidth="3"
                />
            </svg>
            <span className="absolute text-xl font-black text-primary">{score}</span>
        </div>
        <span className="text-[10px] font-bold uppercase text-slate-800/50 mt-1">Interview Score</span>
    </div>
);

const RadarChart: React.FC = () => (
    <div className="relative w-full aspect-square max-w-[280px] mx-auto flex items-center justify-center">
        {/* Radar Grid Layers */}
        <div
            className="absolute inset-0 border-2 border-off-white opacity-20"
            style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }}
        />
        <div
            className="absolute inset-4 border border-off-white opacity-30"
            style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }}
        />
        <div
            className="absolute inset-8 border border-off-white opacity-40"
            style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }}
        />
        <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100">
            <polygon
                points="50,15 85,45 70,85 30,85 15,45"
                fill="#415A77"
                fillOpacity="0.3"
                stroke="#415A77"
                strokeWidth="2"
            />
            <text x="50" y="5" textAnchor="middle" fill="#0D1B2A" fontSize="5" fontWeight="bold">
                Problem Solving
            </text>
            <text x="95" y="45" textAnchor="start" fill="#0D1B2A" fontSize="5" fontWeight="bold">
                Communication
            </text>
            <text x="80" y="95" textAnchor="middle" fill="#0D1B2A" fontSize="5" fontWeight="bold">
                Leadership
            </text>
            <text x="20" y="95" textAnchor="middle" fill="#0D1B2A" fontSize="5" fontWeight="bold">
                Teamwork
            </text>
            <text x="5" y="45" textAnchor="end" fill="#0D1B2A" fontSize="5" fontWeight="bold">
                Adaptability
            </text>
        </svg>
    </div>
);

// --- Main Component ---

const SentimentAnalysis: React.FC = () => {
    // Alternate candidate avatars for messages
    const candidateAvatars = [CANDIDATE_AVATAR_SMALL_1, CANDIDATE_AVATAR_SMALL_2];
    let candidateMessageIndex = 0;

    return (
        <div
            className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-[#f0f1f0]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
            {/* ─── Top Navigation Bar ─── */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-primary/10 bg-white px-10 py-3 sticky top-0 z-50">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3 text-primary">
                        <div className="w-6 h-6">
                            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z"
                                    fill="currentColor"
                                />
                            </svg>
                        </div>
                        <h2 className="text-slate-800 text-xl font-extrabold leading-tight tracking-tight">
                            NEXUS AI
                        </h2>
                    </div>
                    <nav className="hidden md:flex items-center gap-6">
                        <Link
                            className="text-slate-800/70 hover:text-primary text-sm font-semibold transition-colors"
                            to="/candidates"
                        >
                            Candidates
                        </Link>
                        <Link
                            className="text-slate-800/70 hover:text-primary text-sm font-semibold transition-colors"
                            to="/jobs"
                        >
                            Jobs
                        </Link>
                        <Link
                            className="text-primary text-sm font-bold border-b-2 border-primary pb-1"
                            to="/sentiment-analysis"
                        >
                            Analytics
                        </Link>
                        <Link
                            className="text-slate-800/70 hover:text-primary text-sm font-semibold transition-colors"
                            to="#"
                        >
                            Settings
                        </Link>
                    </nav>
                </div>
                <div className="flex flex-1 justify-end gap-4 items-center">
                    <label className="hidden lg:flex flex-col min-w-40 h-10 max-w-64">
                        <div className="flex w-full flex-1 items-stretch rounded-lg h-full bg-off-white/50">
                            <div className="text-primary/60 flex items-center justify-center pl-3">
                                <span className="material-symbols-outlined text-[20px]">search</span>
                            </div>
                            <input
                                className="flex w-full min-w-0 flex-1 border-none bg-transparent focus:ring-0 text-sm font-medium placeholder:text-slate-800/40 outline-none"
                                placeholder="Search insights..."
                                type="text"
                            />
                        </div>
                    </label>
                    <button className="flex items-center gap-2 rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-sm active:scale-95">
                        <span className="material-symbols-outlined text-sm">ios_share</span>
                        <span>Export Report</span>
                    </button>
                    <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 h-10 border-2 border-primary/20"
                        style={{ backgroundImage: `url("${HR_AVATAR}")` }}
                    />
                </div>
            </header>

            {/* ─── Main Content ─── */}
            <main className="flex-1 flex flex-col max-w-[1440px] mx-auto w-full px-4 md:px-10 py-6">
                {/* Breadcrumbs */}
                <div className="flex flex-col gap-1 mb-6">
                    <div className="flex items-center gap-2 text-slate-800/50 text-xs font-bold uppercase tracking-widest">
                        <Link className="hover:text-primary transition-colors" to="/candidates">
                            Pipeline
                        </Link>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <Link className="hover:text-primary transition-colors" to="/jobs">
                            Senior Full Stack Role
                        </Link>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-primary">Phase 2 Analysis</span>
                    </div>
                </div>

                {/* ── Candidate Profile Overview ── */}
                <div className="bg-white rounded-xl p-6 mb-8 border border-primary/10 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-4 border-off-white overflow-hidden shadow-inner">
                                <img
                                    className="w-full h-full object-cover"
                                    alt="Alex Morgan - Senior Candidate"
                                    src={CANDIDATE_AVATAR}
                                />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-[14px] font-bold">
                                    check
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Alex Morgan</h1>
                            <p className="text-slate-800/60 font-medium">
                                Interviewed by AI Recruiter Sarah • 42 mins duration
                            </p>
                            <div className="flex gap-2 mt-2">
                                <span className="px-2 py-0.5 bg-off-white text-primary text-[10px] font-bold rounded uppercase tracking-wider">
                                    Technical Phase
                                </span>
                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tracking-wider">
                                    Top 5% Candidate
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-8">
                        <InterviewScoreCircle score={88} />
                        <div className="h-16 w-[1px] bg-primary/10" />
                        <div className="flex flex-col gap-2">
                            <button className="w-48 bg-off-white hover:bg-off-white/80 text-slate-800 text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-sm">person_add</span>
                                Share with Manager
                            </button>
                            <button className="w-48 bg-primary hover:bg-primary/90 text-white text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 active:scale-95">
                                <span className="material-symbols-outlined text-sm">event_available</span>
                                Schedule Phase 3
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Main Content Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left: Transcript Feed */}
                    <div className="lg:col-span-7 flex flex-col gap-4">
                        <div className="flex items-center justify-between px-2 mb-2">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">forum</span>
                                Chronological Transcript
                            </h3>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-800/40 uppercase">
                                <span>Time-stamped</span>
                                <span className="material-symbols-outlined text-[16px]">history</span>
                            </div>
                        </div>

                        {/* Chat Bubbles */}
                        <div className="flex flex-col gap-6">
                            {TRANSCRIPT_MESSAGES.map((msg) => {
                                if (msg.sender === 'ai') {
                                    return <AiMessage key={msg.id} message={msg} />;
                                }
                                const avatar = candidateAvatars[candidateMessageIndex % candidateAvatars.length];
                                candidateMessageIndex++;
                                return (
                                    <CandidateMessage
                                        key={msg.id}
                                        message={msg}
                                        avatarSrc={avatar}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Dashboard Panels */}
                    <div className="lg:col-span-5 flex flex-col gap-6 sticky top-24">
                        {/* Soft Skills Radar */}
                        <div className="bg-white rounded-xl border border-primary/10 p-6 shadow-sm">
                            <h3 className="text-md font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">insights</span>
                                Soft Skill Breakdown
                            </h3>
                            <RadarChart />
                            <div className="mt-8 grid grid-cols-2 gap-4">
                                {SOFT_SKILL_STATS.map((stat) => (
                                    <div
                                        key={stat.label}
                                        className="p-3 bg-[#f0f1f0] rounded-lg border border-primary/5"
                                    >
                                        <p className="text-[10px] font-bold text-slate-800/40 uppercase mb-1">
                                            {stat.label}
                                        </p>
                                        <p className="text-lg font-black text-primary">{stat.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Consistency Meter */}
                        <div className="bg-white rounded-xl border border-primary/10 p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">balance</span>
                                    Truthfulness &amp; Consistency
                                </h3>
                                <span className="material-symbols-outlined text-green-500">verified_user</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between text-[10px] font-bold text-slate-800/50 uppercase">
                                    <span>Anomalous</span>
                                    <span>Very Consistent</span>
                                </div>
                                <div className="h-4 w-full bg-off-white rounded-full overflow-hidden relative">
                                    <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-green-500 w-[94%] rounded-full shadow-lg" />
                                </div>
                                <p className="text-xs font-medium text-slate-800/70 mt-2">
                                    AI detected high correlation between verbal answers and technical claims. Minimal
                                    hesitation observed during core skill assessment.
                                </p>
                            </div>
                        </div>

                        {/* Behavioral Summary */}
                        <div className="bg-primary text-white rounded-xl p-6 shadow-md">
                            <h3 className="text-md font-bold mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-white">psychology</span>
                                Behavioral AI Summary
                            </h3>
                            <p className="text-sm leading-relaxed text-white/90 italic font-medium">
                                "Candidate Alex shows strong technical leadership potential but may struggle with
                                high-pressure conflict resolution. His emphasis on data-driven decisions is a key
                                cultural fit for the current engineering squad."
                            </p>
                            <div className="mt-4 flex items-center gap-2">
                                <div className="h-[1px] flex-1 bg-white/20" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                                    Sarah AI Core Analysis
                                </span>
                                <div className="h-[1px] flex-1 bg-white/20" />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SentimentAnalysis;
