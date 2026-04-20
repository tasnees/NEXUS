import React, { useState, useEffect, useRef } from 'react';
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
    applied_job?: string;
}

interface UpdatePayload {
    name: string;
    email: string;
    applied_job: string;
    summary: string;
}

interface FilterState {
    search: string;
    activeRoleFilter: string | null;
}

interface SyncStatus {
    running: boolean;
    last_run: string | null;
    processed: number;
    skipped: number;
    failed: number;
    error: string | null;
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

// --- Action Dropdown ---
const ActionMenu: React.FC<{
    candidate: Candidate;
    onUpdate: (c: Candidate) => void;
    onDelete: (c: Candidate) => void;
}> = ({ candidate, onUpdate, onDelete }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                className="text-accent hover:text-primary p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
                title="Actions"
            >
                <span className="material-symbols-outlined">more_vert</span>
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-1 w-44 bg-white rounded-xl shadow-lg border border-accent/10 overflow-hidden animate-fade-in">
                    <button
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors"
                        onClick={(e) => { e.stopPropagation(); setOpen(false); onUpdate(candidate); }}
                    >
                        <span className="material-symbols-outlined text-base text-primary">edit</span>
                        Update Candidate
                    </button>
                    <button
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors"
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            setOpen(false); 
                            const link = `http://localhost:5173/portal/assessment-portal?assessment_id=1&email=${encodeURIComponent(candidate.email || 'candidate@nexthire.ai')}`;
                            navigator.clipboard.writeText(link);
                            alert("📋 Assessment link copied to clipboard!"); 
                        }}
                    >
                        <span className="material-symbols-outlined text-base text-primary">content_copy</span>
                        Copy Invite Link
                    </button>
                    <div className="border-t border-accent/10" />
                    <button
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(candidate); }}
                    >
                        <span className="material-symbols-outlined text-base">delete</span>
                        Delete Candidate
                    </button>
                </div>
            )}
        </div>
    );
};

// --- Update Modal ---
const UpdateModal: React.FC<{
    candidate: Candidate;
    onClose: () => void;
    onSaved: (updated: Candidate) => void;
}> = ({ candidate, onClose, onSaved }) => {
    const [form, setForm] = useState<UpdatePayload>({
        name: candidate.name,
        email: '',
        applied_job: candidate.applied_job || '',
        summary: '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const res = await fetch(`http://localhost:8001/api/v1/candidates/${candidate.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error((await res.json()).detail || 'Update failed');
            const data = await res.json();
            onSaved({
                ...candidate,
                name: data.name || candidate.name,
                applied_job: data.applied_job,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || candidate.name)}&background=random`,
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                <button className="absolute top-4 right-4 text-accent hover:text-primary transition-colors" onClick={onClose}>
                    <span className="material-symbols-outlined">close</span>
                </button>
                <h2 className="text-lg font-extrabold text-slate-800 mb-1">Update Candidate</h2>
                <p className="text-sm text-accent mb-6">Edit the profile details below.</p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-bold text-accent uppercase mb-1">Full Name</label>
                        <input
                            className="w-full border border-accent/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-accent uppercase mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full border border-accent/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                            value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                            placeholder="(leave blank to keep existing)"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-accent uppercase mb-1">Applied Job</label>
                        <input
                            className="w-full border border-accent/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                            value={form.applied_job}
                            onChange={(e) => setForm((f) => ({ ...f, applied_job: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-accent uppercase mb-1">Summary</label>
                        <textarea
                            rows={3}
                            className="w-full border border-accent/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-none"
                            value={form.summary}
                            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                            placeholder="(leave blank to keep existing)"
                        />
                    </div>
                    {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-accent/20 text-sm font-bold text-accent hover:bg-slate-50 transition">Cancel</button>
                        <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition disabled:opacity-50">
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Delete Confirm Modal ---
const DeleteConfirmModal: React.FC<{
    candidate: Candidate;
    onClose: () => void;
    onDeleted: (id: number) => void;
}> = ({ candidate, onClose, onDeleted }) => {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        setDeleting(true);
        setError('');
        try {
            const res = await fetch(`http://localhost:8001/api/v1/candidates/${candidate.id}`, { method: 'DELETE' });
            if (res.status !== 204 && !res.ok) throw new Error('Delete failed');
            onDeleted(candidate.id);
        } catch (err: any) {
            setError(err.message);
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 relative animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col items-center text-center gap-3 mb-6">
                    <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-red-600">person_remove</span>
                    </div>
                    <h2 className="text-lg font-extrabold text-slate-800">Delete Candidate?</h2>
                    <p className="text-sm text-accent">
                        Are you sure you want to permanently remove <span className="font-bold text-slate-700">{candidate.name}</span>? This action cannot be undone.
                    </p>
                </div>
                {error && <p className="text-xs text-red-600 font-semibold text-center mb-3">{error}</p>}
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-accent/20 text-sm font-bold text-accent hover:bg-slate-50 transition">Cancel</button>
                    <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition disabled:opacity-50">
                        {deleting ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                </div>
            </div>
        </div>
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
    const [updateTarget, setUpdateTarget] = useState<Candidate | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Candidate | null>(null);
    const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
    const [syncHistory, setSyncHistory] = useState<any[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);

    const fetchCandidates = async () => {
        try {
            const response = await fetch('http://localhost:8001/api/v1/candidates/');
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            
            // Map DB schema to UI schema
            const mapped: Candidate[] = data.map((c: any) => ({
                id: c.id,
                name: c.name || "Anonymous",
                email: c.email || "",
                role: c.skills?.[0] || "Applicant",
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || 'A')}&background=random`,
                aiScore: 70 + (c.skills?.length || 0) * 2,
                quizScore: 75,
                sentiment: 'positive' as const,
                status: 'new' as const,
                applied_job: c.applied_job,
            }));
            
            setCandidates(mapped);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSyncHistory = async () => {
        try {
            const res = await fetch('http://localhost:8001/api/v1/sync/history');
            if (res.ok) setSyncHistory(await res.json());
        } catch {}
    };

    useEffect(() => {
        fetchCandidates();
        fetchSyncHistory();
    }, []);

    // Poll sync status
    useEffect(() => {
        let interval: any;
        if (isSyncing) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch('http://localhost:8001/api/v1/sync/status');
                    if (res.ok) {
                        const status: SyncStatus = await res.json();
                        setSyncStatus(status);
                        if (!status.running) {
                            setIsSyncing(false);
                            fetchCandidates(); // Refresh list when done
                            fetchSyncHistory(); // Refresh history
                        }
                    }
                } catch (err) {
                    console.error("Sync status poll error:", err);
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isSyncing]);

    // Initial sync status check
    useEffect(() => {
        const checkInitialStatus = async () => {
            try {
                const res = await fetch('http://localhost:8001/api/v1/sync/status');
                if (res.ok) {
                    const status = await res.json();
                    setSyncStatus(status);
                    if (status.running) setIsSyncing(true);
                }
            } catch {}
        };
        checkInitialStatus();
    }, []);

    const handleCandidateUpdated = (updated: Candidate) => {
        setCandidates((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
        setUpdateTarget(null);
    };

    const handleCandidateDeleted = (id: number) => {
        setCandidates((prev) => prev.filter((c) => c.id !== id));
        setDeleteTarget(null);
    };

    const [currentPage, setCurrentPage] = useState<number>(1);

    const filteredCandidates = candidates.filter((c) => {
        const matchesSearch =
            !filters.search ||
            c.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            c.role.toLowerCase().includes(filters.search.toLowerCase());

        const activeFilter = filters.activeRoleFilter?.toLowerCase() || '';
        const matchesRole =
            !filters.activeRoleFilter ||
            (c.applied_job && c.applied_job.toLowerCase().includes(activeFilter)) ||
            c.role.toLowerCase().includes(activeFilter) ||
            activeFilter.includes(c.role.toLowerCase());

        return matchesSearch && matchesRole;
    });

    const handleClearFilters = () => {
        setFilters({ search: '', activeRoleFilter: null });
    };

    return (
        <>
        {updateTarget && (
            <UpdateModal
                candidate={updateTarget}
                onClose={() => setUpdateTarget(null)}
                onSaved={handleCandidateUpdated}
            />
        )}
        {deleteTarget && (
            <DeleteConfirmModal
                candidate={deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onDeleted={handleCandidateDeleted}
            />
        )}
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
                        <button 
                            onClick={async (e) => {
                                e.stopPropagation();
                                setIsSyncing(true);
                                try {
                                    const res = await fetch('http://localhost:8001/api/v1/sync/', { method: 'POST' });
                                    if (!res.ok) {
                                        const err = await res.json();
                                        alert("❌ Sync failed to start: " + (err.detail || "Unknown error"));
                                        setIsSyncing(false);
                                    }
                                } catch (err) {
                                    alert("❌ Connection error: " + err);
                                    setIsSyncing(false);
                                }
                            }}
                            disabled={isSyncing}
                            className="bg-accent hover:bg-accent/90 text-white flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        >
                            <span className={`material-symbols-outlined text-lg ${isSyncing ? 'animate-spin' : ''}`}>
                                {isSyncing ? 'sync' : 'cloud_sync'}
                            </span>
                            {isSyncing ? 'Syncing Drive...' : 'Sync CVs from Drive'}
                        </button>
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

                {/* Sync Status Toast/Notice */}
                {syncStatus && (syncStatus.running || (syncStatus.last_run && (syncStatus.processed > 0 || syncStatus.failed > 0 || syncStatus.error))) && (
                    <div className="mx-8 mt-6 p-4 bg-white rounded-xl border border-accent/10 shadow-sm flex items-center justify-between animate-fade-in">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${syncStatus.running ? 'bg-blue-50' : syncStatus.error ? 'bg-red-50' : 'bg-green-50'}`}>
                                <span className={`material-symbols-outlined ${syncStatus.running ? 'text-blue-600 animate-spin' : syncStatus.error ? 'text-red-600' : 'text-green-600'}`}>
                                    {syncStatus.running ? 'sync' : syncStatus.error ? 'error' : 'check_circle'}
                                </span>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">
                                    {syncStatus.running ? 'Syncing Candidates...' : syncStatus.error ? 'Sync Failed' : 'Sync Completed'}
                                </h4>
                                <p className="text-xs text-accent">
                                    {syncStatus.running 
                                        ? `Currently processing Google Drive... (${syncStatus.processed} found so far)`
                                        : syncStatus.error 
                                            ? `Error: ${syncStatus.error}`
                                            : `Last run: ${new Date(syncStatus.last_run!).toLocaleString()} • ${syncStatus.processed} new, ${syncStatus.skipped} skipped, ${syncStatus.failed} failed`
                                    }
                                </p>
                            </div>
                        </div>
                        {!syncStatus.running && (
                            <button 
                                onClick={() => setSyncStatus(null)}
                                className="text-accent hover:text-slate-800"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        )}
                    </div>
                )}

                {/* History Drawer-like section (Static for now) */}
                {!syncStatus?.running && syncHistory.length > 0 && (
                    <div className="mx-8 mt-4 flex items-center gap-6 overflow-x-auto pb-2 custom-scrollbar">
                        <span className="text-[10px] font-black text-accent uppercase tracking-widest whitespace-nowrap">Recent Syncs:</span>
                        {syncHistory.map((h) => (
                            <div key={h.id} className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-full border border-accent/5 whitespace-nowrap">
                                <span className={`w-1.5 h-1.5 rounded-full ${h.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-[10px] font-bold text-slate-700">
                                    {h.status === 'success' ? `+${h.processed} synced` : 'Failed'}
                                </span>
                                <span className="text-[10px] text-accent/60">
                                    {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

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
                                ) : (
                                    (() => {
                                        const grouped = filteredCandidates.reduce((acc, c) => {
                                            let job = c.applied_job || 'Uncategorized';
                                            
                                            // Normalize "missing" or "not provided" strings
                                            const normalized = job.toLowerCase().trim();
                                            if (!normalized || normalized === 'not provided' || normalized === 'n/a' || normalized === 'none') {
                                                job = 'Uncategorized';
                                            }
                                            
                                            if (!acc[job]) acc[job] = [];
                                            acc[job].push(c);
                                            return acc;
                                        }, {} as Record<string, Candidate[]>);

                                        return Object.entries(grouped)
                                            .sort(([a], [b]) => {
                                                if (a === 'Uncategorized') return 1;
                                                if (b === 'Uncategorized') return -1;
                                                return a.localeCompare(b);
                                            })
                                            .map(([job, jobCandidates]) => (
                                                <React.Fragment key={job}>
                                                    <tr className="bg-[#f8f9fa] border-l-4 border-primary">
                                                        <td colSpan={6} className="px-6 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="material-symbols-outlined text-primary text-sm">work</span>
                                                                <span className="text-xs font-black text-slate-700 uppercase tracking-widest">
                                                                    {job === 'Uncategorized' ? 'Needs Review / Uncategorized' : job}
                                                                </span>
                                                                <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                                    {jobCandidates.length}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                {jobCandidates.map((candidate) => (
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
                                                        <td className="px-6 py-4 text-center">
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
                                                        <td className="px-6 py-4 text-right">
                                                            <ActionMenu
                                                                candidate={candidate}
                                                                onUpdate={setUpdateTarget}
                                                                onDelete={setDeleteTarget}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ));
                                    })()
                                )}
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
        </>
    );
};

export default Candidates;
