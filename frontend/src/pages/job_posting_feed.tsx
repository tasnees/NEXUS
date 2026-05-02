import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Briefcase, 
    Users, 
    Clock, 
    AlertCircle, 
    Search, 
    ChevronRight, 
    Plus, 
    Archive,
    MapPin,
    DollarSign,
    User,
    Calendar,
    X,
    CheckCircle,
    Info,
    Sparkles,
    Send,
    Loader2,
    Globe,
    Building
} from 'lucide-react';

// --- Types ---
interface Pipeline {
    applied: number;
    screening: number;
    interview: number;
    assessment: number;
    offer: number;
}

interface Position {
    id: number;
    title: string;
    department: string;
    location: string;
    type: string;
    salary: string;
    posted: string;
    status: string;
    manager: string;
    applicants: number;
    pipeline: Pipeline;
    urgency: 'high' | 'medium' | 'low';
    description: string;
}

const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/wyv5w8y6awvl56u2y5a253680ndkrqyx";

const JobPostingFeed: React.FC = () => {
    const navigate = useNavigate();
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [deptFilter, setDeptFilter] = useState('all');
    
    // Modal state (Details)
    const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Create Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [isEnriching, setIsEnriching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        department: '',
        location: 'Remote',
        nature: 'online', // for backend: onsite, online, hybrid
        salary: '',
        description: '',
        company: 'HireSync AI',
        status: 'active',
        timePerWeek: '40 hours'
    });

    // Toast state
    const [toasts, setToasts] = useState<Array<{id: number, msg: string, type: 'success' | 'danger' | 'info'}>>([]);

    const showToast = (msg: string, type: 'success' | 'danger' | 'info' = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    const fetchPositions = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8001/api/v1/jobs/');
            if (response.ok) {
                const data = await response.json();
                const mapped: Position[] = data.map((j: any) => ({
                    id: j.id,
                    title: j.title,
                    department: j.department || (j.tags && j.tags[0]) || 'Engineering',
                    location: j.location || 'Remote',
                    type: j.nature || 'Full-time',
                    salary: j.salary || '$120K – $160K',
                    posted: j.posted_at || new Date().toISOString(),
                    status: j.status || 'active',
                    manager: j.manager || 'Hiring Team',
                    applicants: j.applicants || 0,
                    pipeline: j.pipeline || {
                        applied: j.applicants || 0,
                        screening: Math.floor((j.applicants || 0) * 0.6),
                        interview: Math.floor((j.applicants || 0) * 0.3),
                        assessment: Math.floor((j.applicants || 0) * 0.1),
                        offer: 0
                    },
                    urgency: j.urgency || (Math.random() > 0.7 ? 'high' : 'medium'),
                    description: j.description || "No description provided."
                }));
                setPositions(mapped);
            }
        } catch (err) {
            console.error("Failed to fetch positions", err);
            showToast("Failed to load positions", "danger");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPositions();
    }, []);

    const filteredPositions = positions.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             p.department.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = deptFilter === 'all' || p.department.toLowerCase() === deptFilter.toLowerCase();
        return matchesSearch && matchesDept;
    });

    const getUrgencyConfig = (u: string) => {
        const configs: Record<string, any> = {
            high: { label: 'High Priority', color: 'bg-red-50 text-red-700 border-red-200' },
            medium: { label: 'Medium', color: 'bg-amber-50 text-amber-700 border-amber-200' },
            low: { label: 'Low', color: 'bg-slate-50 text-slate-600 border-slate-200' }
        };
        return configs[u] || configs.low;
    };

    const openDetails = (p: Position) => {
        setSelectedPosition(p);
        setIsModalOpen(true);
        setTimeout(() => setIsModalVisible(true), 10);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setTimeout(() => {
            setIsModalOpen(false);
            setSelectedPosition(null);
        }, 300);
    };

    const openCreateModal = () => {
        setIsCreateModalOpen(true);
        setTimeout(() => setIsCreateModalVisible(true), 10);
    };

    const closeCreateModal = () => {
        setIsCreateModalVisible(false);
        setTimeout(() => {
            setIsCreateModalOpen(false);
            setFormData({
                title: '',
                department: '',
                location: 'Remote',
                nature: 'online',
                salary: '',
                description: '',
                company: 'HireSync AI',
                status: 'active',
                timePerWeek: '40 hours'
            });
        }, 300);
    };

    const handleAutoFill = async () => {
        if (!formData.title) {
            showToast("Enter a job title first!", "info");
            return;
        }
        setIsEnriching(true);
        showToast("AI is generating details...", "info");
        try {
            const response = await fetch(`http://localhost:8001/api/v1/ai/enrich?title=${encodeURIComponent(formData.title)}`);
            if (response.ok) {
                const aiData = await response.json();
                setFormData(prev => ({
                    ...prev,
                    salary: prev.salary || aiData.salary || '',
                    description: prev.description || aiData.description || '',
                    department: prev.department || (aiData.tags && aiData.tags[0]) || ''
                }));
                showToast("AI Enrichment complete!", "success");
            }
        } catch (err) {
            showToast("AI enrichment failed", "danger");
        } finally {
            setIsEnriching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            // 1. Send to Webhook
            const webhookPromise = fetch(MAKE_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    event: 'job_created',
                    timestamp: new Date().toISOString()
                })
            });

            // 2. Save to Backend
            const backendPromise = fetch('http://localhost:8001/api/v1/jobs/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const [, backendRes] = await Promise.all([webhookPromise, backendPromise]);

            if (backendRes.ok) {
                showToast("Job posted successfully!", "success");
                closeCreateModal();
                fetchPositions();
            } else {
                showToast("Failed to save job locally", "danger");
            }
        } catch (err) {
            showToast("Error submitting job", "danger");
        } finally {
            setIsSubmitting(false);
        }
    };

    const stats = [
        { icon: Briefcase, color: 'emerald', label: 'Active', value: positions.length },
        { icon: Users, color: 'blue', label: 'Total Applicants', value: positions.reduce((acc, p) => acc + p.applicants, 0) },
        { icon: Clock, color: 'purple', label: 'Avg. Days Open', value: '18d' },
        { icon: AlertCircle, color: 'amber', label: 'Need Attention', value: positions.filter(p => p.urgency === 'high').length }
    ];

    return (
        <div className="flex-1 flex flex-col bg-base animate-fade-in relative pb-12">
            {/* Header Section */}
            <section className="px-8 pt-6 pb-0">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-txt-muted mb-1">
                            <button onClick={() => navigate('/dashboard')} className="hover:text-primary transition-colors">Overview</button>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-txt-primary">Positions</span>
                        </div>
                        <h2 className="text-2xl font-semibold tracking-tight text-txt-primary">Open Positions</h2>
                        <p className="text-sm text-txt-muted mt-0.5">Manage job postings and track hiring progress</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-4 py-2 bg-white hover:bg-elevated text-sm font-medium rounded-lg border border-bdr transition-all flex items-center gap-2 text-txt-primary shadow-sm">
                            <Archive className="w-4 h-4" />Closed (12)
                        </button>
                        <button 
                            onClick={openCreateModal}
                            className="px-4 py-2 bg-primary hover:bg-primary-dark text-sm font-medium rounded-lg transition-all flex items-center gap-2 text-white shadow-lg shadow-primary/20"
                        >
                            <Plus className="w-4 h-4" />Create Position
                        </button>
                    </div>
                </div>
            </section>

            {/* Quick Stats */}
            <section className="px-8 pt-5 pb-0">
                <div className="grid grid-cols-4 gap-4">
                    {stats.map((s, idx) => (
                        <div key={idx} className="stat-card bg-surface rounded-xl p-4 cursor-pointer">
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

            {/* Search & Filters */}
            <section className="px-8 pt-5 pb-0">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <input 
                            type="text" 
                            placeholder="Search positions..." 
                            className="w-full bg-white border border-bdr rounded-lg px-4 py-2.5 pl-10 text-sm text-txt-primary placeholder:text-txt-faint outline-none focus:border-primary transition-all shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="w-4 h-4 text-txt-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                    <div className="flex items-center gap-1 bg-white rounded-lg border border-bdr p-1 shadow-sm overflow-x-auto">
                        {['All', 'Engineering', 'Design', 'Data Science', 'Product'].map(dept => (
                            <button 
                                key={dept}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${deptFilter === dept.toLowerCase() || (deptFilter === 'all' && dept === 'All') ? 'bg-primary/10 text-primary active' : 'text-txt-muted hover:bg-base'}`}
                                onClick={() => setDeptFilter(dept.toLowerCase())}
                            >
                                {dept}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Positions List */}
            <section className="px-8 pt-4 pb-8">
                <div className="space-y-3">
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-32 bg-surface rounded-xl border border-bdr animate-pulse"></div>)
                    ) : filteredPositions.length === 0 ? (
                        <div className="py-16 text-center bg-surface rounded-xl border border-bdr border-dashed">
                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                                <Search className="w-7 h-7 text-txt-faint" />
                            </div>
                            <p className="text-sm font-medium text-txt-secondary">No positions found</p>
                        </div>
                    ) : (
                        filteredPositions.map(p => {
                            const u = getUrgencyConfig(p.urgency);
                            const totalPipeline = Object.values(p.pipeline).reduce((a, b) => a + (b as number), 0);
                            const deptColors: Record<string, string> = {
                                Engineering: 'bg-blue-50 text-blue-700 border-blue-200',
                                Design: 'bg-pink-50 text-pink-700 border-pink-200',
                                'Data Science': 'bg-violet-50 text-violet-700 border-violet-200',
                                Product: 'bg-amber-50 text-amber-700 border-amber-200'
                            };
                            const deptColor = deptColors[p.department] || 'bg-slate-50 text-slate-700 border-slate-200';
                            
                            return (
                                <div 
                                    key={p.id} 
                                    className="position-card bg-surface rounded-xl p-5 cursor-pointer border border-bdr transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 group"
                                    onClick={() => openDetails(p)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                <h4 className="text-base font-bold text-txt-primary group-hover:text-primary transition-colors">{p.title}</h4>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${u.color}`}>
                                                    {u.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${deptColor}`}>
                                                    {p.department}
                                                </span>
                                                <span className="text-xs text-txt-muted font-medium flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />{p.location}
                                                </span>
                                                <span className="text-xs text-txt-muted font-medium flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />{p.type}
                                                </span>
                                            </div>
                                            <p className="text-sm text-txt-muted leading-relaxed line-clamp-2 mb-4 font-medium">
                                                {p.description}
                                            </p>
                                            <div className="flex items-center gap-4 text-[11px] text-txt-muted font-bold uppercase tracking-widest">
                                                <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-txt-faint" />{p.salary}</span>
                                                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-txt-faint" />{p.manager}</span>
                                                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-txt-faint" />Posted {new Date(p.posted).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 w-48 border-l border-bdr-light pl-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-[11px] font-bold text-txt-muted uppercase tracking-widest">Pipeline</span>
                                                <span className="text-sm font-black text-txt-primary">{totalPipeline}</span>
                                            </div>
                                            <div className="space-y-2">
                                                {Object.entries(p.pipeline).map(([k, v]) => {
                                                    const pct = totalPipeline ? Math.round((v as number) / totalPipeline * 100) : 0;
                                                    const colors: Record<string, string> = {
                                                        applied: 'bg-blue-500',
                                                        screening: 'bg-purple-500',
                                                        interview: 'bg-cyan-500',
                                                        assessment: 'bg-amber-500',
                                                        offer: 'bg-emerald-500'
                                                    };
                                                    if (v === 0) return null;
                                                    return (
                                                        <div key={k} className="flex items-center gap-2">
                                                            <span className="text-[10px] font-bold text-txt-muted w-14 truncate capitalize tracking-tighter">{k}</span>
                                                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                                <div className={`h-full ${colors[k]} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }}></div>
                                                            </div>
                                                            <span className="text-[10px] font-black text-txt-secondary w-3 text-right">{v as number}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>

            {/* Create Position Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div 
                        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isCreateModalVisible ? 'opacity-100' : 'opacity-0'}`} 
                        onClick={closeCreateModal}
                    ></div>
                    <div 
                        className={`relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden transform transition-all duration-300 ease-out ${isCreateModalVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}`}
                    >
                        <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
                            <div className="p-8 border-b border-bdr flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h3 className="text-2xl font-black text-txt-primary tracking-tight">Create New Position</h3>
                                    <p className="text-xs text-txt-muted font-bold uppercase tracking-widest mt-1">Configure your recruitment requirements</p>
                                </div>
                                <button type="button" onClick={closeCreateModal} className="p-3 rounded-2xl hover:bg-white hover:shadow-md transition-all text-txt-muted">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-txt-muted uppercase tracking-[0.2em] ml-1">Job Title</label>
                                        <div className="relative">
                                            <input 
                                                required
                                                type="text"
                                                placeholder="e.g. Senior Frontend Engineer"
                                                className="w-full bg-base border border-bdr rounded-2xl px-5 py-4 text-sm font-bold text-txt-primary focus:border-primary focus:bg-white outline-none transition-all shadow-inner"
                                                value={formData.title}
                                                onChange={e => setFormData({...formData, title: e.target.value})}
                                            />
                                            <button 
                                                type="button"
                                                onClick={handleAutoFill}
                                                disabled={isEnriching}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                                title="AI Autofill"
                                            >
                                                {isEnriching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-txt-muted uppercase tracking-[0.2em] ml-1">Department</label>
                                        <div className="relative">
                                            <input 
                                                type="text"
                                                placeholder="e.g. Engineering"
                                                className="w-full bg-base border border-bdr rounded-2xl px-5 py-4 pl-12 text-sm font-bold text-txt-primary focus:border-primary focus:bg-white outline-none transition-all shadow-inner"
                                                value={formData.department}
                                                onChange={e => setFormData({...formData, department: e.target.value})}
                                            />
                                            <Building className="w-4 h-4 text-txt-faint absolute left-5 top-1/2 -translate-y-1/2" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-txt-muted uppercase tracking-[0.2em] ml-1">Location</label>
                                        <div className="relative">
                                            <input 
                                                type="text"
                                                placeholder="e.g. San Francisco, CA"
                                                className="w-full bg-base border border-bdr rounded-2xl px-5 py-4 pl-12 text-sm font-bold text-txt-primary focus:border-primary focus:bg-white outline-none transition-all shadow-inner"
                                                value={formData.location}
                                                onChange={e => setFormData({...formData, location: e.target.value})}
                                            />
                                            <MapPin className="w-4 h-4 text-txt-faint absolute left-5 top-1/2 -translate-y-1/2" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-txt-muted uppercase tracking-[0.2em] ml-1">Job Nature</label>
                                        <div className="relative">
                                            <select 
                                                className="w-full bg-base border border-bdr rounded-2xl px-5 py-4 pl-12 text-sm font-bold text-txt-primary focus:border-primary focus:bg-white outline-none transition-all shadow-inner appearance-none cursor-pointer"
                                                value={formData.nature}
                                                onChange={e => setFormData({...formData, nature: e.target.value})}
                                            >
                                                <option value="online">Remote</option>
                                                <option value="onsite">On-site</option>
                                                <option value="hybrid">Hybrid</option>
                                            </select>
                                            <Globe className="w-4 h-4 text-txt-faint absolute left-5 top-1/2 -translate-y-1/2" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-txt-muted uppercase tracking-[0.2em] ml-1">Salary Range</label>
                                    <div className="relative">
                                        <input 
                                            type="text"
                                            placeholder="e.g. $120k - $160k"
                                            className="w-full bg-base border border-bdr rounded-2xl px-5 py-4 pl-12 text-sm font-bold text-txt-primary focus:border-primary focus:bg-white outline-none transition-all shadow-inner"
                                            value={formData.salary}
                                            onChange={e => setFormData({...formData, salary: e.target.value})}
                                        />
                                        <DollarSign className="w-4 h-4 text-txt-faint absolute left-5 top-1/2 -translate-y-1/2" />
                                    </div>
                                    <p className="text-[9px] text-txt-muted font-medium italic ml-1">If empty, AI will estimate based on market rates.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-txt-muted uppercase tracking-[0.2em] ml-1">Job Description</label>
                                    <textarea 
                                        rows={4}
                                        placeholder="Describe the role, responsibilities, and key requirements..."
                                        className="w-full bg-base border border-bdr rounded-2xl px-5 py-4 text-sm font-medium text-txt-primary focus:border-primary focus:bg-white outline-none transition-all shadow-inner resize-none"
                                        value={formData.description}
                                        onChange={e => setFormData({...formData, description: e.target.value})}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="p-8 border-t border-bdr bg-slate-50/50 flex items-center gap-4">
                                <button 
                                    type="button"
                                    onClick={closeCreateModal}
                                    className="px-8 py-4 bg-white hover:bg-elevated text-txt-primary font-bold rounded-2xl border border-bdr transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-4 bg-primary hover:bg-primary-dark text-white font-black rounded-2xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Publishing...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            Post Position
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {isModalOpen && selectedPosition && (
                <div className="fixed inset-0 z-[100]">
                    <div 
                        className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${isModalVisible ? 'opacity-100' : 'opacity-0'}`} 
                        onClick={closeModal}
                    ></div>
                    <div 
                        className={`absolute right-0 top-0 bottom-0 w-[540px] bg-white border-l border-bdr overflow-y-auto transform transition-transform duration-300 ease-out shadow-2xl flex flex-col ${isModalVisible ? 'translate-x-0' : 'translate-x-full'}`}
                    >
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-txt-primary">Position Details</h3>
                                <button onClick={closeModal} className="p-2 rounded-xl hover:bg-elevated text-txt-muted hover:text-txt-secondary transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-3">
                                    <h3 className="text-2xl font-black text-txt-primary leading-tight">{selectedPosition.title}</h3>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getUrgencyConfig(selectedPosition.urgency).color}`}>
                                        {getUrgencyConfig(selectedPosition.urgency).label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                                        {selectedPosition.department}
                                    </span>
                                    <span className="text-sm text-txt-muted font-bold flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4 text-txt-faint" />{selectedPosition.location}
                                    </span>
                                    <span className="text-sm text-txt-muted font-bold flex items-center gap-1.5">
                                        <Briefcase className="w-4 h-4 text-txt-faint" />{selectedPosition.type}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-8">
                                <div className="bg-slate-50 rounded-2xl p-4 text-center border border-bdr-light shadow-sm">
                                    <p className="text-[10px] font-bold text-txt-muted uppercase tracking-widest mb-1">Salary Range</p>
                                    <p className="text-sm font-black text-txt-primary">{selectedPosition.salary}</p>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-4 text-center border border-bdr-light shadow-sm">
                                    <p className="text-[10px] font-bold text-txt-muted uppercase tracking-widest mb-1">Applicants</p>
                                    <p className="text-lg font-black text-txt-primary">{selectedPosition.applicants}</p>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-4 text-center border border-bdr-light shadow-sm">
                                    <p className="text-[10px] font-bold text-txt-muted uppercase tracking-widest mb-1">Days Open</p>
                                    <p className="text-lg font-black text-txt-primary">14d</p>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h4 className="text-[10px] font-black text-txt-muted uppercase tracking-[0.2em] mb-3">Job Description</h4>
                                <div className="bg-white border border-bdr-light rounded-2xl p-5 shadow-sm">
                                    <p className="text-sm text-txt-secondary leading-relaxed font-medium">
                                        {selectedPosition.description}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h4 className="text-[10px] font-black text-txt-muted uppercase tracking-[0.2em] mb-3">Hiring Manager</h4>
                                <div className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-bdr-light shadow-sm">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                                        {selectedPosition.manager.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-txt-primary">{selectedPosition.manager}</p>
                                        <p className="text-xs text-txt-muted font-bold uppercase tracking-widest">Decision Maker</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h4 className="text-[10px] font-black text-txt-muted uppercase tracking-[0.2em] mb-3">Pipeline Overview</h4>
                                <div className="space-y-4 bg-white border border-bdr-light rounded-2xl p-6 shadow-sm">
                                    {Object.entries(selectedPosition.pipeline).map(([k, v]) => {
                                        const total = Object.values(selectedPosition.pipeline).reduce((a, b) => a + (b as number), 0);
                                        const pct = total ? Math.round((v as number) / total * 100) : 0;
                                        const colors: Record<string, string> = {
                                            applied: 'bg-blue-500',
                                            screening: 'bg-purple-500',
                                            interview: 'bg-cyan-500',
                                            assessment: 'bg-amber-500',
                                            offer: 'bg-emerald-500'
                                        };
                                        const labels: Record<string, string> = {
                                            applied: 'New Applied',
                                            screening: 'Initial Screening',
                                            interview: 'In Interviews',
                                            assessment: 'Tech Assessment',
                                            offer: 'Offer Phase'
                                        };
                                        return (
                                            <div key={k}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-bold text-txt-secondary uppercase tracking-tighter">{labels[k]}</span>
                                                    <span className="text-xs font-black text-txt-primary">{v as number}</span>
                                                </div>
                                                <div className="h-2 bg-base rounded-full overflow-hidden shadow-inner">
                                                    <div className={`h-full ${colors[k]} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-bdr bg-slate-50/50 flex items-center gap-3">
                            <button className="flex-1 py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary/20 active:scale-95">Edit Position</button>
                            <button 
                                onClick={() => navigate(`/candidates?job=${encodeURIComponent(selectedPosition.title)}`)}
                                className="flex-1 py-4 bg-white hover:bg-elevated text-txt-primary font-bold rounded-2xl border border-bdr transition-all active:scale-95"
                            >
                                View Candidates
                            </button>
                            <button className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white text-txt-muted border border-bdr hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all shadow-sm">
                                <Archive className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toasts */}
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
        </div>
    );
};

export default JobPostingFeed;
