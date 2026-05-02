import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronRight, 
    Download, 
    Plus, 
    Search, 
    ArrowUpDown, 
    Eye, 
    MoreHorizontal,
    Mail,
    MapPin,
    RefreshCw,
    X,
    ChevronLeft,
    CheckCircle,
    AlertCircle,
    Info,
    ArrowRight,
    Briefcase
} from 'lucide-react';

// --- Types ---
interface Candidate {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    avatarColor?: string;
    applied_job: string;
    stage: string;
    score: number;
    created_at: string;
    skills: string[];
    experience: string;
    location: string;
}

const Candidates: React.FC = () => {
    const navigate = useNavigate();
    
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [stageFilter, setStageFilter] = useState('all');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [isSyncing, setIsSyncing] = useState(false);
    
    // Modal state
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Toast state
    const [toasts, setToasts] = useState<Array<{id: number, msg: string, type: 'success' | 'danger' | 'info'}>>([]);

    const DRIVE_LINK = "https://drive.google.com/drive/folders/1GP4bhdxIabQOs-dPsxS8f8Cc1rmZ__0a";

    const showToast = (msg: string, type: 'success' | 'danger' | 'info' = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8001/api/v1/candidates/');
            if (response.ok) {
                const data = await response.json();
                setCandidates(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Failed to fetch candidates", err);
            showToast("Failed to load candidates", "danger");
        } finally {
            setLoading(false);
        }
    };

    const handleSyncDrive = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        showToast("Syncing with Google Drive...", "info");
        try {
            const response = await fetch('http://localhost:8001/api/v1/sync/', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (response.ok) {
                showToast("Sync completed successfully!", "success");
                fetchCandidates();
                window.dispatchEvent(new CustomEvent('drive-synced'));
            } else {
                showToast("Sync failed. Please check backend logs.", "danger");
            }
        } catch (err) {
            showToast("Network error during sync", "danger");
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        fetchCandidates();
        const handleGlobalSync = () => fetchCandidates();
        window.addEventListener('drive-synced', handleGlobalSync);
        return () => window.removeEventListener('drive-synced', handleGlobalSync);
    }, []);

    const filteredCandidates = candidates.filter(c => {
        const matchesSearch = (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                             (c.applied_job || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                             (c.skills || []).some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStage = stageFilter === 'all' || (c.stage || 'Applied').toLowerCase() === stageFilter.toLowerCase();
        return matchesSearch && matchesStage;
    });

    const getStageConfig = (s: string) => {
        const stages: Record<string, any> = {
            applied: { label: 'Applied', color: 'bg-blue-50 text-blue-700 border-blue-200' },
            screening: { label: 'Screening', color: 'bg-purple-50 text-purple-700 border-purple-200' },
            interview: { label: 'Interview', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
            assessment: { label: 'Assessment', color: 'bg-amber-50 text-amber-700 border-amber-200' },
            offer: { label: 'Offer', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
        };
        return stages[s.toLowerCase()] || { label: s, color: 'bg-slate-50 text-slate-700 border-slate-200' };
    };

    const getScoreColor = (s: number) => s >= 90 ? 'text-emerald-600' : s >= 80 ? 'text-blue-600' : s >= 70 ? 'text-amber-600' : 'text-red-600';
    const getScoreBarColor = (s: number) => s >= 90 ? 'bg-emerald-500' : s >= 80 ? 'bg-blue-500' : s >= 70 ? 'bg-amber-500' : 'bg-red-500';

    const toggleSelect = (id: number) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredCandidates.length && filteredCandidates.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredCandidates.map(c => c.id)));
        }
    };

    const openDetails = (c: Candidate) => {
        setSelectedCandidate(c);
        setIsModalOpen(true);
        setTimeout(() => setIsModalVisible(true), 10);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setTimeout(() => {
            setIsModalOpen(false);
            setSelectedCandidate(null);
        }, 300);
    };

    return (
        <div className="flex-1 flex flex-col bg-base animate-fade-in relative">
            {/* Header Section */}
            <section className="px-8 pt-6 pb-0">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-txt-muted mb-1">
                            <button onClick={() => navigate('/dashboard')} className="hover:text-primary transition-colors">Overview</button>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-txt-primary">Candidates</span>
                        </div>
                        <h2 className="text-2xl font-semibold tracking-tight text-txt-primary">Candidates</h2>
                        <p className="text-sm text-txt-muted mt-0.5">Manage and review all applicants across open positions</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <a 
                            href={DRIVE_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-white hover:bg-elevated text-sm font-medium rounded-lg border border-bdr transition-all flex items-center gap-2 text-txt-primary shadow-sm"
                        >
                            <Download className="w-4 h-4" />View CV Folder
                        </a>
                        <button 
                            onClick={handleSyncDrive}
                            disabled={isSyncing}
                            className="px-4 py-2 bg-secondary hover:bg-secondary-dark text-sm font-medium rounded-lg transition-all flex items-center gap-2 text-white shadow-lg shadow-secondary/20 disabled:opacity-70"
                        >
                            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? 'Syncing...' : 'Sync with Drive'}
                        </button>
                        <button 
                            onClick={() => showToast("Add candidate form coming soon", "info")}
                            className="px-4 py-2 bg-primary hover:bg-primary-dark text-sm font-medium rounded-lg transition-all flex items-center gap-2 text-white shadow-lg shadow-primary/20"
                        >
                            <Plus className="w-4 h-4" />Add Candidate
                        </button>
                    </div>
                </div>
            </section>

            {/* Search & Filters */}
            <section className="px-8 pt-5 pb-0">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <input 
                            type="text" 
                            placeholder="Search by name, role, or skill..." 
                            className="w-full bg-white border border-bdr rounded-lg px-4 py-2.5 pl-10 text-sm text-txt-primary placeholder:text-txt-faint outline-none focus:border-primary transition-all shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="w-4 h-4 text-txt-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                    <div className="flex items-center gap-1 bg-white rounded-lg border border-bdr p-1 shadow-sm">
                        {['All', 'Applied', 'Screening', 'Interview', 'Assessment', 'Offer'].map(stage => (
                            <button 
                                key={stage}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${stageFilter === stage.toLowerCase() ? 'bg-primary/10 text-primary active' : 'text-txt-muted hover:bg-base'}`}
                                onClick={() => setStageFilter(stage.toLowerCase())}
                            >
                                {stage} {stage === 'All' ? `(${candidates.length})` : ''}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Bulk Actions */}
            {selectedIds.size > 0 && (
                <section className="px-8 pt-4 pb-0 animate-fade-in">
                    <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 shadow-sm">
                        <span className="text-sm text-primary font-medium">{selectedIds.size} selected</span>
                        <div className="w-px h-4 bg-blue-200"></div>
                        <button className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                            <ArrowRight className="w-3 h-3" />Advance
                        </button>
                        <button className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                            <Mail className="w-3 h-3" />Email
                        </button>
                        <button className="text-xs text-danger font-medium flex items-center gap-1 hover:underline">
                            <X className="w-3 h-3" />Reject
                        </button>
                        <button onClick={() => setSelectedIds(new Set())} className="text-xs text-txt-muted ml-auto hover:text-txt-secondary transition-colors">Clear</button>
                    </div>
                </section>
            )}

            {/* Table */}
            <section className="px-8 pt-4 pb-8">
                <div className="bg-surface rounded-xl border border-bdr overflow-hidden shadow-sm">
                    <div className="grid grid-cols-[40px_1fr_180px_120px_100px_100px_80px] gap-4 px-5 py-3 border-b border-bdr bg-slate-50/80 text-[11px] font-bold text-txt-muted uppercase tracking-wider">
                        <div className="flex items-center justify-center">
                            <input 
                                type="checkbox" 
                                className="checkbox-custom" 
                                checked={selectedIds.size === filteredCandidates.length && filteredCandidates.length > 0}
                                onChange={toggleSelectAll}
                            />
                        </div>
                        <div className="flex items-center gap-1 cursor-pointer hover:text-txt-primary">Candidate <ArrowUpDown className="w-3 h-3" /></div>
                        <div className="flex items-center gap-1 cursor-pointer hover:text-txt-primary">Position <ArrowUpDown className="w-3 h-3" /></div>
                        <div className="flex items-center gap-1 cursor-pointer hover:text-txt-primary">Stage <ArrowUpDown className="w-3 h-3" /></div>
                        <div className="flex items-center gap-1 cursor-pointer hover:text-txt-primary">AI Score <ArrowUpDown className="w-3 h-3" /></div>
                        <div className="flex items-center gap-1 cursor-pointer hover:text-txt-primary">Applied <ArrowUpDown className="w-3 h-3" /></div>
                        <div className="text-right">Actions</div>
                    </div>

                    <div className="divide-y divide-bdr-light overflow-y-auto max-h-[calc(100vh-360px)] custom-scrollbar">
                        {loading ? (
                            <div className="py-20 text-center">
                                <RefreshCw className="w-10 h-10 text-primary/20 animate-spin mx-auto mb-4" />
                                <p className="text-sm font-medium text-txt-muted uppercase tracking-widest">Scanning Pipeline...</p>
                            </div>
                        ) : filteredCandidates.length === 0 ? (
                            <div className="py-20 text-center">
                                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-7 h-7 text-txt-faint" />
                                </div>
                                <p className="text-sm font-medium text-txt-secondary">No candidates found</p>
                                <p className="text-xs text-txt-muted mt-1">Try adjusting your search or filters</p>
                            </div>
                        ) : (
                            Object.entries(
                                filteredCandidates.reduce((acc, c) => {
                                    const job = c.applied_job || 'General Application';
                                    if (!acc[job]) acc[job] = [];
                                    acc[job].push(c);
                                    return acc;
                                }, {} as Record<string, Candidate[]>)
                            ).map(([job, group]) => (
                                <React.Fragment key={job}>
                                    {/* Group Header */}
                                    <div className="bg-slate-50/50 px-5 py-2.5 border-y border-bdr-light flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-primary" />
                                        <span className="text-[11px] font-black text-txt-primary uppercase tracking-[0.15em]">{job}</span>
                                        <span className="bg-primary/10 text-primary text-[10px] px-2.5 py-0.5 rounded-full font-black border border-primary/20">{group.length} Candidates</span>
                                    </div>
                                    
                                    {group.map(c => {
                                        const sc = getStageConfig(c.stage || 'Applied');
                                        const isSelected = selectedIds.has(c.id);
                                        return (
                                            <div key={c.id} className={`candidate-row grid grid-cols-[40px_1fr_180px_120px_100px_100px_80px] gap-4 px-5 py-3.5 items-center transition-all ${isSelected ? 'bg-blue-50/60' : ''}`}>
                                                <div className="flex items-center justify-center">
                                                    <input 
                                                        type="checkbox" 
                                                        className="checkbox-custom" 
                                                        checked={isSelected}
                                                        onChange={() => toggleSelect(c.id)}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 shadow-sm">
                                                        {c.name ? c.name.split(' ').map(n => n[0]).join('') : '?'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <button onClick={() => navigate(`/candidate/${c.id}`)} className="text-sm font-medium text-txt-primary hover:text-primary transition-colors truncate block text-left w-full">
                                                            {c.name || 'Unknown Candidate'}
                                                        </button>
                                                        <p className="text-xs text-txt-muted truncate">{c.email}</p>
                                                    </div>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm text-txt-secondary truncate">{c.applied_job || 'General Application'}</p>
                                                    <p className="text-xs text-txt-muted truncate font-medium">{c.location || 'Remote'}</p>
                                                </div>
                                                <div>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${sc.color}`}>
                                                        {sc.label}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className={`text-sm font-bold ${getScoreColor(c.score || 0)}`}>{c.score || 0}</span>
                                                    <span className="text-[10px] text-txt-muted ml-0.5 font-bold">/100</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-txt-secondary font-medium">
                                                        {c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openDetails(c)} className="p-1.5 rounded-md hover:bg-elevated text-txt-muted hover:text-primary transition-all">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-1.5 rounded-md hover:bg-elevated text-txt-muted hover:text-txt-secondary transition-all">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ))
                        )}
                    </div>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-txt-muted">
                        Showing <span className="text-txt-primary font-semibold">{filteredCandidates.length}</span> of <span className="text-txt-primary font-semibold">{candidates.length}</span> candidates
                    </p>
                    <div className="flex items-center gap-1">
                        <button className="px-3 py-1.5 rounded-md text-sm text-txt-muted hover:bg-elevated disabled:opacity-30" disabled>
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button className="px-3 py-1.5 rounded-md text-sm bg-primary/10 text-primary font-bold">1</button>
                        <button className="px-3 py-1.5 rounded-md text-sm text-txt-muted hover:bg-elevated">2</button>
                        <button className="px-3 py-1.5 rounded-md text-sm text-txt-muted hover:bg-elevated">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Toast Notifications */}
            <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className="toast flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl bg-white min-w-[280px] pointer-events-auto">
                        {t.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                        {t.type === 'danger' && <AlertCircle className="w-5 h-5 text-red-500" />}
                        {t.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                        <span className="text-sm font-semibold text-txt-primary">{t.msg}</span>
                    </div>
                ))}
            </div>

            {/* Candidate Modal (Slide-over) */}
            {isModalOpen && selectedCandidate && (
                <div className="fixed inset-0 z-[90]">
                    <div 
                        className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${isModalVisible ? 'opacity-100' : 'opacity-0'}`} 
                        onClick={closeModal}
                    ></div>
                    <div 
                        className={`absolute right-0 top-0 bottom-0 w-[520px] bg-white border-l border-bdr overflow-y-auto transform transition-transform duration-300 ease-out shadow-2xl flex flex-col ${isModalVisible ? 'translate-x-0' : 'translate-x-full'}`}
                    >
                        <div className="p-8 flex-1">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-txt-primary">Candidate Profile</h3>
                                <button onClick={closeModal} className="p-2 rounded-xl hover:bg-elevated text-txt-muted hover:text-txt-secondary transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex items-center gap-5 mb-8">
                                <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                    {selectedCandidate.name ? selectedCandidate.name.split(' ').map(n => n[0]).join('') : '?'}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-txt-primary leading-tight">{selectedCandidate.name}</h3>
                                    <p className="text-txt-muted font-medium mt-1">{selectedCandidate.applied_job}</p>
                                    <p className="text-xs text-txt-muted mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{selectedCandidate.location || 'Remote'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-8">
                                <div className="bg-slate-50/50 rounded-2xl p-4 text-center border border-bdr-light shadow-sm">
                                    <p className="text-[10px] font-bold text-txt-muted uppercase tracking-widest mb-1">AI Score</p>
                                    <p className={`text-2xl font-black ${getScoreColor(selectedCandidate.score)}`}>{selectedCandidate.score}</p>
                                </div>
                                <div className="bg-slate-50/50 rounded-2xl p-4 text-center border border-bdr-light shadow-sm flex flex-col items-center justify-center">
                                    <p className="text-[10px] font-bold text-txt-muted uppercase tracking-widest mb-1">Stage</p>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-tighter ${getStageConfig(selectedCandidate.stage).color}`}>
                                        {getStageConfig(selectedCandidate.stage).label}
                                    </span>
                                </div>
                                <div className="bg-slate-50/50 rounded-2xl p-4 text-center border border-bdr-light shadow-sm">
                                    <p className="text-[10px] font-bold text-txt-muted uppercase tracking-widest mb-1">XP</p>
                                    <p className="text-base font-bold text-txt-primary mt-0.5">{selectedCandidate.experience || '4y'}</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-[10px] font-black text-txt-muted uppercase tracking-[0.2em] mb-3">Contact Details</h4>
                                    <div className="space-y-3 bg-white border border-bdr-light rounded-2xl p-4 shadow-sm">
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 rounded-lg bg-base flex items-center justify-center"><Mail className="w-4 h-4 text-primary" /></div>
                                            <span className="text-txt-secondary font-medium">{selectedCandidate.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 rounded-lg bg-base flex items-center justify-center"><MapPin className="w-4 h-4 text-primary" /></div>
                                            <span className="text-txt-secondary font-medium">{selectedCandidate.location || 'San Francisco, CA'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black text-txt-muted uppercase tracking-[0.2em] mb-3">Core Skills</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {(selectedCandidate.skills || []).map(s => (
                                            <span key={s} className="px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10 text-xs text-primary font-bold shadow-sm transition-all hover:bg-primary/10">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black text-txt-muted uppercase tracking-[0.2em] mb-3">AI Sentiment & Analysis</h4>
                                    <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] -mr-10 -mt-10 group-hover:bg-primary/30 transition-all"></div>
                                        <p className="text-sm text-slate-300 leading-relaxed font-medium relative z-10 italic">
                                            "{selectedCandidate.score >= 90 
                                                ? 'Top-tier candidate. Demonstrated exceptional command over architectural patterns and modern frameworks. High cultural alignment detected.' 
                                                : 'Strong technical foundation. Well-suited for mid-to-senior transitions with structured mentorship. Positive attitude during initial screening.'}"
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black text-txt-muted uppercase tracking-[0.2em] mb-3">Skill Breakdown</h4>
                                    <div className="space-y-4 bg-white border border-bdr-light rounded-2xl p-5 shadow-sm">
                                        {[
                                            { l: 'Technical Depth', v: selectedCandidate.score },
                                            { l: 'Communication', v: 92 },
                                            { l: 'Problem Solving', v: 88 },
                                            { l: 'System Design', v: 85 }
                                        ].map(i => (
                                            <div key={i.l}>
                                                <div className="flex justify-between text-xs font-bold mb-1.5">
                                                    <span className="text-txt-muted uppercase tracking-tighter">{i.l}</span>
                                                    <span className={`${getScoreColor(i.v)} font-black`}>{i.v}%</span>
                                                </div>
                                                <div className="h-1.5 bg-base rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-1000 ${getScoreBarColor(i.v)}`} style={{ width: `${i.v}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-8 border-t border-bdr bg-slate-50/50 flex items-center gap-3">
                            <button className="flex-1 py-3.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary/20 active:scale-95">Advance Stage</button>
                            <button className="flex-1 py-3.5 bg-white hover:bg-elevated text-txt-primary font-bold rounded-2xl border border-bdr transition-all active:scale-95">Schedule Interview</button>
                            <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Candidates;
