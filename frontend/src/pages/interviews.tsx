import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, 
    ChevronRight, 
    Video, 
    Clock, 
    Plus, 
    RefreshCw,
    Filter,
    Calendar as CalendarIcon,
    CheckCircle,
    AlertCircle,
    Info,
    ExternalLink,
    X,
    Trash2
} from 'lucide-react';

// --- Types ---
interface Interview {
    id: number;
    candidate_name: string;
    role: string;
    date: string;
    status: string;
    interview_type?: string;
    interview_mean?: string;
    meet_link?: string;
}

const Interviews: React.FC = () => {
    const navigate = useNavigate();
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // Modal & Form State
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [availableJobs, setAvailableJobs] = useState<any[]>([]);
    const [allCandidates, setAllCandidates] = useState<any[]>([]);
    const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
    const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
        candidate_name: '',
        role: '',
        date: '',
        time: '',
        interview_type: 'Assessment',
        interview_mean: 'Video Call',
        meet_link: ''
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

    const fetchInterviews = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8001/api/v1/interviews/');
            if (response.ok) {
                const data = await response.json();
                setInterviews(data);
            }
        } catch (err) {
            console.error(err);
            showToast("Failed to load interviews", "danger");
        } finally {
            setLoading(false);
        }
    };

    const fetchJobsAndCandidates = async () => {
        try {
            const [jobsRes, candidatesRes] = await Promise.all([
                fetch('http://localhost:8001/api/v1/jobs/'),
                fetch('http://localhost:8001/api/v1/candidates/')
            ]);
            
            if (jobsRes.ok) setAvailableJobs(await jobsRes.json());
            if (candidatesRes.ok) setAllCandidates(await candidatesRes.json());
        } catch (err) {
            console.error("Failed to fetch jobs/candidates", err);
        }
    };

    const handleSyncCalendar = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        showToast("Syncing with Google Calendar...", "info");
        try {
            const response = await fetch('http://localhost:8001/api/v1/sync/calendar', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (response.ok) {
                showToast("Calendar sync started!", "success");
                // Poll for status or just refresh after a delay
                setTimeout(fetchInterviews, 2000);
            } else {
                showToast("Sync failed. Check backend configuration.", "danger");
            }
        } catch (err) {
            showToast("Network error during sync", "danger");
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        fetchInterviews();
        fetchJobsAndCandidates();
        const handleGlobalSync = () => {
            fetchInterviews();
            fetchJobsAndCandidates();
        };
        window.addEventListener('drive-synced', handleGlobalSync);
        return () => window.removeEventListener('drive-synced', handleGlobalSync);
    }, []);

    // Filter candidates when role changes
    useEffect(() => {
        if (formData.role) {
            const filtered = allCandidates.filter(c => c.applied_job === formData.role);
            setFilteredCandidates(filtered);
            // Reset candidate if not in filtered list
            if (!filtered.find(c => c.name === formData.candidate_name)) {
                setFormData(prev => ({ ...prev, candidate_name: '' }));
            }
        } else {
            setFilteredCandidates([]);
        }
    }, [formData.role, allCandidates]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleInterviewClick = (interview: Interview) => {
        setSelectedInterview(interview);
        setShowDetailsModal(true);
        setIsEditing(false);
    };

    const handleEditClick = () => {
        if (!selectedInterview) return;
        const dateObj = new Date(selectedInterview.date);
        setFormData({
            candidate_name: selectedInterview.candidate_name,
            role: selectedInterview.role,
            date: dateObj.toISOString().split('T')[0],
            time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            interview_type: selectedInterview.interview_type || 'Assessment',
            interview_mean: selectedInterview.interview_mean || 'Video Call',
            meet_link: selectedInterview.meet_link || ''
        });
        setIsEditing(true);
    };

    const handleScheduleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            // Combine date and time
            const interviewDate = new Date(`${formData.date}T${formData.time}`);
            
            const payload = {
                candidate_name: formData.candidate_name,
                role: formData.role,
                date: interviewDate.toISOString(),
                interview_type: formData.interview_type,
                interview_mean: formData.interview_mean,
                meet_link: formData.meet_link,
                status: 'scheduled'
            };

            const response = await fetch(`http://localhost:8001/api/v1/interviews/${isEditing ? selectedInterview?.id : ''}`, {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                showToast(isEditing ? "Interview updated successfully!" : "Interview scheduled successfully!", "success");
                setShowModal(false);
                setIsEditing(false);
                setShowDetailsModal(false);
                setFormData({ candidate_name: '', role: '', date: '', time: '', interview_type: 'Assessment', interview_mean: 'Video Call', meet_link: '' });
                fetchInterviews();
            } else {
                showToast("Failed to save interview", "danger");
            }
        } catch (err) {
            console.error(err);
            showToast("Network error", "danger");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteInterview = async () => {
        if (!selectedInterview) return;
        
        if (!window.confirm(`Are you sure you want to cancel the interview for ${selectedInterview.candidate_name}? This will also remove it from Google Calendar.`)) {
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`http://localhost:8001/api/v1/interviews/${selectedInterview.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showToast("Interview cancelled and removed from calendar", "success");
                setShowDetailsModal(false);
                setSelectedInterview(null);
                fetchInterviews();
            } else {
                showToast("Failed to delete interview", "danger");
            }
        } catch (err) {
            console.error(err);
            showToast("Network error", "danger");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Calendar Logic ---
    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const days = daysInMonth(year, month);
        const startDay = firstDayOfMonth(year, month);
        
        const cells = [];
        // Empty cells for days of the previous month
        for (let i = 0; i < startDay; i++) {
            cells.push(<div key={`empty-${i}`} className="h-32 border-b border-r border-bdr bg-slate-50/30"></div>);
        }
        
        // Month days
        for (let day = 1; day <= days; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayInterviews = interviews.filter(int => int.date.startsWith(dateStr));
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
            
            cells.push(
                <div key={day} className="h-32 border-b border-r border-bdr bg-white p-2 hover:bg-slate-50/50 transition-all relative group overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-black ${isToday ? 'w-6 h-6 bg-primary text-white flex items-center justify-center rounded-lg shadow-lg shadow-primary/20' : 'text-txt-muted'}`}>
                            {day}
                        </span>
                        {dayInterviews.length > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        )}
                    </div>
                    <div className="mt-2 space-y-1 overflow-y-auto max-h-[85px] custom-scrollbar">
                        {dayInterviews.map(int => (
                            <div 
                                key={int.id} 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleInterviewClick(int);
                                }}
                                className="px-2 py-1.5 bg-primary/5 border border-primary/10 rounded-lg text-[9px] font-bold text-primary truncate hover:bg-primary/10 transition-colors cursor-pointer flex items-center gap-1"
                            >
                                <div className="w-1 h-1 rounded-full bg-primary"></div>
                                {int.candidate_name}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        
        // Empty cells for the rest of the last row
        const totalCells = startDay + days;
        const remaining = 42 - totalCells; // 6 rows * 7 days
        for (let i = 0; i < remaining; i++) {
            cells.push(<div key={`empty-end-${i}`} className="h-32 border-b border-r border-bdr bg-slate-50/30"></div>);
        }
        
        return cells;
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const todayInterviews = interviews.filter(int => int.date.startsWith(todayStr));

    return (
        <div className="flex-1 flex flex-col bg-base animate-fade-in relative pb-12">
            {/* Header Section */}
            <section className="px-8 pt-6 pb-0">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-txt-muted mb-1">
                            <button onClick={() => navigate('/dashboard')} className="hover:text-primary transition-colors">Overview</button>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-txt-primary">Interviews</span>
                        </div>
                        <h2 className="text-2xl font-semibold tracking-tight text-txt-primary">Interview Calendar</h2>
                        <p className="text-sm text-txt-muted mt-0.5">Coordinate and manage your recruitment schedule</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-4 py-2 bg-white hover:bg-elevated text-sm font-medium rounded-lg border border-bdr transition-all flex items-center gap-2 text-txt-primary shadow-sm">
                            <Filter className="w-4 h-4" />Filters
                        </button>
                        <button 
                            onClick={() => setShowModal(true)}
                            className="px-4 py-2 bg-primary hover:bg-primary-dark text-sm font-medium rounded-lg transition-all flex items-center gap-2 text-white shadow-lg shadow-primary/20"
                        >
                            <Plus className="w-4 h-4" />Schedule Interview
                        </button>
                    </div>
                </div>
            </section>

            {/* Calendar Main Grid */}
            <section className="px-8 pt-6 pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Calendar Container */}
                    <div className="lg:col-span-3">
                        <div className="bg-surface rounded-2xl border border-bdr overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-bdr flex items-center justify-between bg-slate-50/50">
                                <h3 className="text-lg font-black text-txt-primary uppercase tracking-tight">
                                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                                        className="p-2 rounded-xl bg-white border border-bdr hover:border-primary transition-all text-txt-muted hover:text-primary shadow-sm"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => setCurrentDate(new Date())}
                                        className="px-4 py-2 bg-white border border-bdr rounded-xl text-xs font-black text-txt-primary hover:border-primary transition-all shadow-sm"
                                    >
                                        TODAY
                                    </button>
                                    <button 
                                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                                        className="p-2 rounded-xl bg-white border border-bdr hover:border-primary transition-all text-txt-muted hover:text-primary shadow-sm"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-7 bg-slate-50/80 text-center border-b border-bdr">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="py-3 text-[10px] font-black text-txt-muted uppercase tracking-[0.2em]">{day}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7">
                                {renderCalendar()}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Upcoming Today */}
                        <div className="bg-surface rounded-2xl border border-bdr p-6 shadow-sm">
                            <h4 className="text-[10px] font-black text-txt-muted uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                                Upcoming Today
                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[9px]">{todayInterviews.length}</span>
                            </h4>
                            <div className="space-y-4">
                                {loading ? (
                                    [1, 2].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse"></div>)
                                ) : todayInterviews.length === 0 ? (
                                    <div className="text-center py-6">
                                        <Clock className="w-8 h-8 text-txt-faint mx-auto mb-2" />
                                        <p className="text-[11px] text-txt-muted italic font-medium">No sessions scheduled today</p>
                                    </div>
                                ) : (
                                    todayInterviews.map(int => (
                                        <div 
                                            key={int.id} 
                                            onClick={() => handleInterviewClick(int)}
                                            className="flex gap-4 p-3 rounded-2xl border border-slate-50 bg-slate-50/30 hover:border-primary/30 transition-all group cursor-pointer relative overflow-hidden"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                                <Video className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-txt-primary truncate group-hover:text-primary transition-colors">{int.candidate_name}</p>
                                                <p className="text-[10px] text-txt-muted truncate font-medium">{int.role} • {int.interview_type}</p>
                                                <div className="flex items-center gap-1 mt-1 text-[10px] font-black text-primary">
                                                    <Clock className="w-3 h-3" /> {new Date(int.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    <span className="mx-1 text-txt-faint">•</span>
                                                    <span className="text-txt-secondary">{int.interview_mean}</span>
                                                </div>
                                            </div>
                                            {int.meet_link && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(int.meet_link, '_blank');
                                                    }}
                                                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-primary/10 rounded-lg hover:bg-primary hover:text-white"
                                                    title="Launch Google Meet"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Calendar Sync Card */}
                        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[80px] -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="flex items-center gap-3 mb-4 relative z-10">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                    <CalendarIcon className="w-5 h-5 text-primary" />
                                </div>
                                <h4 className="text-base font-black tracking-tight">Calendar Sync</h4>
                            </div>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed mb-6 relative z-10">
                                Connect your G-Suite to automate scheduling
                            </p>
                            <button 
                                onClick={handleSyncCalendar}
                                disabled={isSyncing}
                                className="w-full bg-primary text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 relative z-10 shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-70 active:scale-95"
                            >
                                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                                {isSyncing ? 'Synchronizing...' : 'Sync Calendar'}
                            </button>
                        </div>

                        {/* Availability Stats */}
                        <div className="bg-surface rounded-2xl border border-bdr p-6 shadow-sm">
                            <h4 className="text-[10px] font-black text-txt-muted uppercase tracking-[0.2em] mb-4">Availability Stats</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-[11px] font-bold text-txt-muted uppercase tracking-tighter">Weekly Load</span>
                                    <span className="text-lg font-black text-txt-primary">12h</span>
                                </div>
                                <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden shadow-inner">
                                    <div className="h-full bg-gradient-to-r from-primary to-secondary w-[65%] rounded-full"></div>
                                </div>
                                <p className="text-[10px] text-txt-muted leading-relaxed font-medium">
                                    You are at <span className="text-primary font-bold">65%</span> capacity for this week. 4 slots remaining.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Toasts */}
            <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className="toast flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl bg-white min-w-[280px] pointer-events-auto animate-slide-in">
                        {t.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                        {t.type === 'danger' && <AlertCircle className="w-5 h-5 text-red-500" />}
                        {t.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                        <span className="text-sm font-semibold text-txt-primary">{t.msg}</span>
                    </div>
                ))}
            </div>

            {/* Schedule Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => !isSubmitting && setShowModal(false)}></div>
                    <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-bdr overflow-hidden animate-zoom-in">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-bdr bg-slate-50/50 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-txt-primary tracking-tight">SCHEDULE INTERVIEW</h3>
                                <p className="text-xs text-txt-muted font-bold uppercase tracking-wider mt-1">Setup a new recruitment session</p>
                            </div>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-bdr transition-all"
                            >
                                <X className="w-5 h-5 text-txt-muted" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleScheduleSubmit} className="p-8 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-txt-muted uppercase tracking-[0.15em] ml-1">Role / Position</label>
                                    <select 
                                        required
                                        name="role"
                                        value={formData.role}
                                        onChange={handleFormChange}
                                        className="w-full px-4 py-3 rounded-xl border border-bdr bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium outline-none appearance-none"
                                    >
                                        <option value="">Select a Role</option>
                                        {availableJobs.map(job => (
                                            <option key={job.id} value={job.title}>{job.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-txt-muted uppercase tracking-[0.15em] ml-1">Candidate Name</label>
                                    <select 
                                        required
                                        name="candidate_name"
                                        value={formData.candidate_name}
                                        onChange={handleFormChange}
                                        disabled={!formData.role}
                                        className="w-full px-4 py-3 rounded-xl border border-bdr bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium outline-none appearance-none disabled:opacity-50"
                                    >
                                        <option value="">{formData.role ? 'Select a Candidate' : 'Select Role First'}</option>
                                        {filteredCandidates.map(c => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-txt-muted uppercase tracking-[0.15em] ml-1">Date</label>
                                    <input 
                                        required
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleFormChange}
                                        className="w-full px-4 py-3 rounded-xl border border-bdr bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-txt-muted uppercase tracking-[0.15em] ml-1">Time</label>
                                    <input 
                                        required
                                        type="time"
                                        name="time"
                                        value={formData.time}
                                        onChange={handleFormChange}
                                        className="w-full px-4 py-3 rounded-xl border border-bdr bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-txt-muted uppercase tracking-[0.15em] ml-1">Nature of Booking</label>
                                    <select 
                                        name="interview_type"
                                        value={formData.interview_type}
                                        onChange={handleFormChange}
                                        className="w-full px-4 py-3 rounded-xl border border-bdr bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium outline-none appearance-none"
                                    >
                                        <option value="Assessment">Assessment Session</option>
                                        <option value="Technical Interview">Technical Interview</option>
                                        <option value="HR Screening">HR Screening</option>
                                        <option value="Final Round">Final Round</option>
                                        <option value="Culture Fit">Culture Fit</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-txt-muted uppercase tracking-[0.15em] ml-1">Interview Mean</label>
                                    <select 
                                        name="interview_mean"
                                        value={formData.interview_mean}
                                        onChange={handleFormChange}
                                        className="w-full px-4 py-3 rounded-xl border border-bdr bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium outline-none appearance-none"
                                    >
                                        <option value="Video Call">Video Call</option>
                                        <option value="Phone Call">Phone Call</option>
                                        <option value="In-Person">In-Person</option>
                                        <option value="On-site Day">On-site Day</option>
                                    </select>
                                </div>
                            </div>

                            {formData.interview_mean === 'Video Call' && (
                                <div className="space-y-2 animate-fade-in">
                                    <label className="text-[10px] font-black text-txt-muted uppercase tracking-[0.15em] ml-1">Manual Meeting Link (Optional)</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-txt-faint group-focus-within:text-primary transition-colors">
                                            <ExternalLink className="w-4 h-4" />
                                        </div>
                                        <input 
                                            type="url"
                                            name="meet_link"
                                            placeholder="https://meet.google.com/abc-defg-hij"
                                            value={formData.meet_link}
                                            onChange={handleFormChange}
                                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-bdr bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium outline-none placeholder:text-txt-faint/50"
                                        />
                                    </div>
                                    <p className="text-[9px] text-txt-faint font-bold uppercase tracking-wider ml-1 mt-1">
                                        Leave empty to attempt automated Google Meet generation
                                    </p>
                                </div>
                            )}

                            <div className="pt-4 flex items-center gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    disabled={isSubmitting}
                                    className="flex-1 px-6 py-3.5 bg-white hover:bg-slate-50 text-txt-primary font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl border border-bdr transition-all active:scale-95 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-[1.5] px-6 py-3.5 bg-primary hover:bg-primary-dark text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    {isSubmitting ? 'Scheduling...' : 'Confirm Schedule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Interview Details Modal */}
            {showDetailsModal && selectedInterview && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md animate-fade-in" onClick={() => setShowDetailsModal(false)}></div>
                    <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-bdr overflow-hidden animate-zoom-in">
                        {/* Header with Background Pattern */}
                        <div className="h-24 bg-primary relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20 pointer-events-none">
                                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,_var(--tw-gradient-stops))] from-white/40 to-transparent"></div>
                                <div className="grid grid-cols-6 gap-2 rotate-12 -mt-10">
                                    {[...Array(24)].map((_, i) => (
                                        <div key={i} className="h-10 border-l border-white/20"></div>
                                    ))}
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowDetailsModal(false)}
                                className="absolute top-6 right-6 p-2 bg-black/10 hover:bg-black/20 text-white rounded-full transition-all z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-10 pb-10 -mt-12 relative z-10">
                            {isEditing ? (
                                <form onSubmit={handleScheduleSubmit} className="pt-16 space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-txt-muted uppercase tracking-[0.15em] ml-1">Role / Position</label>
                                            <select 
                                                required
                                                name="role"
                                                value={formData.role}
                                                onChange={handleFormChange}
                                                className="w-full px-4 py-3 rounded-xl border border-bdr bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium outline-none appearance-none"
                                            >
                                                <option value="">Select a Role</option>
                                                {availableJobs.map(job => (
                                                    <option key={job.id} value={job.title}>{job.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-txt-muted uppercase tracking-[0.15em] ml-1">Candidate Name</label>
                                            <select 
                                                required
                                                name="candidate_name"
                                                value={formData.candidate_name}
                                                onChange={handleFormChange}
                                                disabled={!formData.role}
                                                className="w-full px-4 py-3 rounded-xl border border-bdr bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium outline-none appearance-none disabled:opacity-50"
                                            >
                                                <option value="">{formData.role ? 'Select a Candidate' : 'Select Role First'}</option>
                                                {filteredCandidates.map(c => (
                                                    <option key={c.id} value={c.name}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-txt-muted uppercase tracking-[0.15em] ml-1">Date</label>
                                            <input 
                                                required
                                                type="date"
                                                name="date"
                                                value={formData.date}
                                                onChange={handleFormChange}
                                                className="w-full px-4 py-3 rounded-xl border border-bdr bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-txt-muted uppercase tracking-[0.15em] ml-1">Time</label>
                                            <input 
                                                required
                                                type="time"
                                                name="time"
                                                value={formData.time}
                                                onChange={handleFormChange}
                                                className="w-full px-4 py-3 rounded-xl border border-bdr bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-txt-muted uppercase tracking-[0.15em] ml-1">Interview Type</label>
                                            <select 
                                                name="interview_type"
                                                value={formData.interview_type}
                                                onChange={handleFormChange}
                                                className="w-full px-4 py-3 rounded-xl border border-bdr bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium outline-none appearance-none"
                                            >
                                                <option value="Assessment">Assessment Session</option>
                                                <option value="Technical Interview">Technical Interview</option>
                                                <option value="HR Screening">HR Screening</option>
                                                <option value="Final Round">Final Round</option>
                                                <option value="Culture Fit">Culture Fit</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-txt-muted uppercase tracking-[0.15em] ml-1">Medium</label>
                                            <select 
                                                name="interview_mean"
                                                value={formData.interview_mean}
                                                onChange={handleFormChange}
                                                className="w-full px-4 py-3 rounded-xl border border-bdr bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium outline-none appearance-none"
                                            >
                                                <option value="Video Call">Video Call</option>
                                                <option value="Phone Call">Phone Call</option>
                                                <option value="In-Person">In-Person</option>
                                                <option value="On-site Day">On-site Day</option>
                                            </select>
                                        </div>
                                    </div>

                                    {formData.interview_mean === 'Video Call' && (
                                        <div className="space-y-2 animate-fade-in">
                                            <label className="text-[10px] font-black text-txt-muted uppercase tracking-[0.15em] ml-1">Manual Meeting Link</label>
                                            <input 
                                                type="url"
                                                name="meet_link"
                                                value={formData.meet_link}
                                                onChange={handleFormChange}
                                                className="w-full px-4 py-3 rounded-xl border border-bdr bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium outline-none"
                                            />
                                        </div>
                                    )}

                                    <div className="pt-4 flex gap-3">
                                        <button 
                                            type="button" 
                                            onClick={() => setIsEditing(false)}
                                            className="flex-1 py-3.5 bg-white text-txt-primary border border-bdr rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                                        >
                                            Back to Details
                                        </button>
                                        <button 
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-[1.5] py-3.5 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className="w-24 h-24 rounded-3xl bg-white border-4 border-white shadow-xl flex items-center justify-center text-primary mb-6">
                                        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                                            <Video className="w-10 h-10" />
                                        </div>
                                    </div>

                                    <div className="mb-8 flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-2xl font-black text-txt-primary tracking-tight">{selectedInterview.candidate_name}</h3>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                    selectedInterview.status === 'scheduled' ? 'bg-primary/10 text-primary' : 'bg-emerald-100 text-emerald-600'
                                                }`}>
                                                    {selectedInterview.status}
                                                </span>
                                            </div>
                                            <p className="text-base font-bold text-txt-muted">{selectedInterview.role}</p>
                                        </div>
                                        <button 
                                            onClick={handleEditClick}
                                            className="p-3 bg-slate-50 hover:bg-slate-100 text-txt-muted hover:text-primary rounded-2xl border border-slate-100 transition-all"
                                            title="Edit Interview"
                                        >
                                            <Filter className="w-5 h-5 rotate-90" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-8">
                                        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                                            <div className="flex items-center gap-2 text-txt-muted mb-2">
                                                <CalendarIcon className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Date</span>
                                            </div>
                                            <p className="text-sm font-bold text-txt-primary">
                                                {new Date(selectedInterview.date).toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                                            <div className="flex items-center gap-2 text-txt-muted mb-2">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Time</span>
                                            </div>
                                            <p className="text-sm font-bold text-txt-primary">
                                                {new Date(selectedInterview.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                                            <div className="flex items-center gap-2 text-txt-muted mb-2">
                                                <Info className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Type</span>
                                            </div>
                                            <p className="text-sm font-bold text-txt-primary">{selectedInterview.interview_type || 'N/A'}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                                            <div className="flex items-center gap-2 text-txt-muted mb-2">
                                                <Filter className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Medium</span>
                                            </div>
                                            <p className="text-sm font-bold text-txt-primary">{selectedInterview.interview_mean || 'N/A'}</p>
                                        </div>
                                    </div>

                                    {selectedInterview.meet_link ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-txt-muted uppercase tracking-widest">Google Meet Connection</span>
                                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <div className="flex gap-3">
                                                <button 
                                                    onClick={() => window.open(selectedInterview.meet_link, '_blank')}
                                                    className="flex-1 py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                                >
                                                    <ExternalLink className="w-5 h-5" />
                                                    Join Video Call
                                                </button>
                                                <button 
                                                    onClick={handleDeleteInterview}
                                                    disabled={isSubmitting}
                                                    className="px-6 py-4 bg-white hover:bg-red-50 text-red-500 rounded-2xl border border-bdr hover:border-red-200 transition-all active:scale-[0.98] disabled:opacity-50"
                                                    title="Cancel Interview"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="p-6 rounded-3xl bg-slate-50 border border-dashed border-slate-200 text-center">
                                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                                    <AlertCircle className="w-6 h-6 text-txt-faint" />
                                                </div>
                                                <p className="text-sm font-bold text-txt-muted">No Meet link generated yet.</p>
                                                <p className="text-[10px] text-txt-faint mt-1">Check your calendar sync or permissions.</p>
                                            </div>
                                            <button 
                                                onClick={handleDeleteInterview}
                                                disabled={isSubmitting}
                                                className="w-full py-4 bg-white hover:bg-red-50 text-red-500 rounded-2xl border border-bdr hover:border-red-200 font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                                Cancel Interview
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Interviews;
