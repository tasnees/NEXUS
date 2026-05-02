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
    ExternalLink
} from 'lucide-react';

// --- Types ---
interface Interview {
    id: number;
    candidate_name: string;
    role: string;
    date: string;
    status: string;
    interview_type?: string;
}

const Interviews: React.FC = () => {
    const navigate = useNavigate();
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    
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
        const handleGlobalSync = () => fetchInterviews();
        window.addEventListener('drive-synced', handleGlobalSync);
        return () => window.removeEventListener('drive-synced', handleGlobalSync);
    }, []);

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
                            onClick={() => showToast("Schedule interview form coming soon", "info")}
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
                                        <div key={int.id} className="flex gap-4 p-3 rounded-2xl border border-slate-50 bg-slate-50/30 hover:border-primary/30 transition-all group cursor-pointer relative overflow-hidden">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                                <Video className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-txt-primary truncate group-hover:text-primary transition-colors">{int.candidate_name}</p>
                                                <p className="text-[10px] text-txt-muted truncate font-medium">{int.role}</p>
                                                <div className="flex items-center gap-1 mt-1 text-[10px] font-black text-primary">
                                                    <Clock className="w-3 h-3" /> {new Date(int.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            <button className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ExternalLink className="w-3 h-3 text-txt-faint hover:text-primary" />
                                            </button>
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

export default Interviews;
