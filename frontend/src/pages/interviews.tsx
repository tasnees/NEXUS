import React, { useState, useEffect } from 'react';


// --- Types ---

interface InterviewEntry {
    id: string | number;
    candidate_name: string;
    role: string;
    date: string; // ISO date string
    interview_type: 'technical' | 'screening' | 'final';
    status: 'scheduled' | 'completed' | 'cancelled';
}

interface Candidate {
    id: number;
    name: string;
}

interface Job {
    id: number;
    title: string;
}

// --- Helper Functions ---
const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
};

// --- Components ---

const CalendarCell: React.FC<{ 
    day: number | null; 
    interviews: InterviewEntry[]; 
    isToday: boolean;
    onDayClick: (day: number) => void;
}> = ({ day, interviews, isToday, onDayClick }) => {
    if (day === null) return <div className="h-32 bg-slate-50 opacity-20" />;

    return (
        <div 
            onClick={() => onDayClick(day)}
            className={`h-32 p-3 border border-slate-100 group transition-all hover:bg-primary/5 cursor-pointer relative ${isToday ? 'bg-primary/5' : 'bg-white'}`}
        >
            <span className={`text-sm font-bold ${isToday ? 'bg-primary text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-slate-400 group-hover:text-primary transition-colors'}`}>
                {day}
            </span>
            <div className="mt-2 space-y-1 overflow-hidden">
                {interviews.map((int) => (
                    <div key={int.id} className="text-[10px] font-bold py-1 px-2 rounded-md truncate bg-secondary/10 text-primary border border-primary/10 hover:shadow-sm transition-all">
                        {int.candidate_name}
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- View Component ---

const Interviews: React.FC = () => {
    const [interviews, setInterviews] = useState<InterviewEntry[]>([]);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Form State
    const [selectedCandidate, setSelectedCandidate] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [intDate, setIntDate] = useState('');
    const [intTime, setIntTime] = useState('');
    const [intType, setIntType] = useState<'technical' | 'screening' | 'final'>('technical');

    const fetchData = async () => {
        try {
            console.log("Fetching pipeline data...");
            // Fetch Interviews
            const intRes = await fetch('http://localhost:8001/api/v1/interviews/');
            if (intRes.ok) {
                const intData = await intRes.json();
                setInterviews(Array.isArray(intData) ? intData : []);
            }

            // Fetch Candidates
            const candRes = await fetch('http://localhost:8001/api/v1/candidates/');
            if (candRes.ok) {
                const candData = await candRes.json();
                console.log("Candidates fetched:", candData);
                setCandidates(Array.isArray(candData) ? candData : []);
            }

            // Fetch Jobs
            const jobRes = await fetch('http://localhost:8001/api/v1/jobs/');
            if (jobRes.ok) {
                const jobData = await jobRes.json();
                console.log("Jobs fetched:", jobData);
                setJobs(Array.isArray(jobData) ? jobData : []);
            }
        } catch (error) {
            console.error('CRITICAL: Vetting system offline.', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const daysInMonth = getDaysInMonth(currentDate.getMonth(), currentDate.getFullYear());
    const firstDay = getFirstDayOfMonth(currentDate.getMonth(), currentDate.getFullYear());
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));

    const gridCells = [];
    for (let i = 0; i < firstDay; i++) gridCells.push(null);
    for (let i = 1; i <= daysInMonth; i++) gridCells.push(i);

    const openScheduleModal = (day?: number) => {
        if (day) {
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const d = String(day).padStart(2, '0');
            setIntDate(`${year}-${month}-${d}`);
        }
        setIsModalOpen(true);
    };

    const handleSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const dateTime = new Date(`${intDate}T${intTime}:00`);
            const response = await fetch('http://localhost:8001/api/v1/interviews/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidate_name: selectedCandidate,
                    role: selectedRole,
                    date: dateTime.toISOString(),
                    interview_type: intType,
                    status: 'scheduled'
                })
            });

            if (response.ok) {
                setIsModalOpen(false);
                fetchData();
                // Reset form
                setSelectedCandidate('');
                setSelectedRole('');
                setIntDate('');
                setIntTime('');
            }
        } catch (error) {
            console.error('Error scheduling interview:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 overflow-hidden" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-12 custom-scrollbar">
                <div className="max-w-[1200px] mx-auto">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Vetting <span className="text-primary">Calendar</span></h1>
                            <p className="text-slate-400 font-medium">Coordinate inter-team interviews and AI scoring sessions.</p>
                        </div>
                        <button 
                            onClick={() => openScheduleModal()}
                            className="bg-primary text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-2xl shadow-primary/30 hover:scale-105 hover:-translate-y-0.5 transition-all active:scale-95 group"
                        >
                            <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add</span> 
                            Schedule Event
                        </button>
                    </div>

                    <div className="glass-panel rounded-3xl p-10 bg-white border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                        {/* Custom Calendar Header */}
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-6">
                                <h2 className="text-3xl font-black text-slate-800">
                                    {currentDate.toLocaleString('default', { month: 'long' })} <span className="text-primary/40">{currentDate.getFullYear()}</span>
                                </h2>
                                <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                                    <button onClick={prevMonth} className="p-2 hover:bg-white rounded-lg transition-all shadow-sm">
                                        <span className="material-symbols-outlined text-slate-600 block">chevron_left</span>
                                    </button>
                                    <button onClick={nextMonth} className="p-2 hover:bg-white rounded-lg transition-all shadow-sm">
                                        <span className="material-symbols-outlined text-slate-600 block">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border border-slate-200">Today</button>
                                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                                    <button className="px-5 py-2 bg-white shadow-sm rounded-lg text-xs font-black uppercase tracking-widest text-primary">Month</button>
                                    <button className="px-5 py-2 hover:bg-white rounded-lg text-xs font-black uppercase tracking-widest text-slate-400">Week</button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-7 mb-4">
                            {dayNames.map(day => (
                                <div key={day} className="py-2 text-center text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{day}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 border-l border-t border-slate-100 rounded-2xl overflow-hidden ring-1 ring-slate-100">
                            {gridCells.map((day, idx) => {
                                const currentDayInterviews = interviews.filter(int => {
                                    const d = new Date(int.date);
                                    return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
                                });
                                const isToday = day === new Date().getDate() && 
                                               currentDate.getMonth() === new Date().getMonth() && 
                                               currentDate.getFullYear() === new Date().getFullYear();
                                return (
                                    <CalendarCell 
                                        key={idx} 
                                        day={day} 
                                        interviews={currentDayInterviews} 
                                        isToday={isToday}
                                        onDayClick={openScheduleModal}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* Upcoming List */}
                    <div className="mt-16 grid grid-cols-12 gap-10">
                        <div className="col-span-12 lg:col-span-8">
                            <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                                <span className="w-2 h-8 bg-primary rounded-full"></span>
                                Upcoming pipeline syncs
                            </h3>
                            <div className="space-y-4">
                                {interviews.length === 0 ? (
                                    <div className="p-20 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                                        <div className="material-symbols-outlined text-5xl text-slate-200 mb-4">event_busy</div>
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No vetting activities scheduled</p>
                                    </div>
                                ) : (
                                    interviews.map(int => (
                                        <div key={int.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:shadow-2xl hover:shadow-primary/5 transition-all">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-2xl border border-slate-100 group-hover:bg-primary group-hover:text-white transition-all">
                                                    <span className="material-symbols-outlined text-2xl">person</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black text-slate-800">{int.candidate_name}</h4>
                                                    <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm">work</span> {int.role}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-10">
                                                <div className="text-right">
                                                    <div className="text-sm font-black text-slate-800">{new Date(int.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{new Date(int.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                                                </div>
                                                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                                    int.interview_type === 'technical' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                                    int.interview_type === 'final' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                }`}>
                                                    {int.interview_type}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="col-span-12 lg:col-span-4">
                            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[80px] -mr-10 -mt-10 group-hover:scale-150 transition-transform"></div>
                                <h4 className="text-2xl font-black mb-4 relative z-10">Calendar Sync</h4>
                                <p className="text-sm text-slate-400 font-medium leading-relaxed mb-8 relative z-10">Automate your availability by tethering your Corporate G-Workspace account.</p>
                                <button 
                                    onClick={async () => {
                                        const btn = document.activeElement as HTMLButtonElement;
                                        const original = btn.innerHTML;
                                        btn.disabled = true;
                                        btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">sync</span> Syncing...';
                                        
                                        try {
                                            const res = await fetch('http://localhost:8001/api/v1/sync/calendar', { method: 'POST' });
                                            if (res.ok) {
                                                // Poll for completion
                                                const checkStatus = setInterval(async () => {
                                                    const statRes = await fetch('http://localhost:8001/api/v1/sync/calendar/status');
                                                    if (statRes.ok) {
                                                        const status = await statRes.json();
                                                        if (!status.running) {
                                                            clearInterval(checkStatus);
                                                            await fetchData(); // Refresh local list
                                                            btn.disabled = false;
                                                            btn.innerHTML = original;
                                                            if (status.error) {
                                                                alert(`⚠️ Calendar Sync Error: ${status.error}\n\nTip: Ensure your calendar is shared with the service account email.`);
                                                            } else {
                                                                alert(`✅ Google Calendar synced! Successfully imported ${status.new_events} new appointments.`);
                                                            }
                                                        }
                                                    }
                                                }, 2000);
                                            } else {
                                                btn.disabled = false;
                                                btn.innerHTML = original;
                                                alert("❌ Sync already in progress.");
                                            }
                                        } catch (err) {
                                            btn.disabled = false;
                                            btn.innerHTML = original;
                                            alert("❌ Connection to backend failed.");
                                        }
                                    }}
                                    className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 relative z-10 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined">sync</span> Link & Sync Workspace
                                </button>
                            </div>
                            
                            <div className="mt-8 p-8 border border-slate-100 rounded-[2.5rem] bg-white shadow-soft">
                                <h5 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Pipeline Health</h5>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-bold text-slate-400">Completion Rate</span>
                                        <span className="text-xl font-black text-slate-800">84%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-[84%] transition-all"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* --- Schedule Event Modal --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300 backdrop-blur-xl">
                    <div className="absolute inset-0 bg-slate-900/60" onClick={() => setIsModalOpen(false)}></div>
                    <form 
                        onSubmit={handleSchedule} 
                        className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-[0_32px_64px_-10px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 p-8 md:p-12 max-h-[90vh] overflow-y-auto custom-scrollbar"
                    >
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h2 className="text-3xl font-black text-slate-800 mb-2">Book <span className="text-primary">Pipeline</span></h2>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Scheduling new assessment event</p>
                            </div>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                                <span className="material-symbols-outlined text-2xl">close</span>
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Candidate</label>
                                    <select 
                                        required 
                                        value={selectedCandidate} 
                                        onChange={e => setSelectedCandidate(e.target.value)}
                                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none"
                                    >
                                        <option value="" disabled>Select Candidate...</option>
                                        {candidates.map(c => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                        <option value="Manual Entry">Manual Entry...</option>
                                    </select>
                                    {selectedCandidate === 'Manual Entry' && (
                                        <input 
                                            required 
                                            className="mt-2 w-full px-5 py-2 bg-white border border-primary/20 rounded-lg text-sm font-bold outline-none shadow-sm"
                                            placeholder="Custom name..."
                                            onChange={e => setSelectedCandidate(e.target.value)}
                                        />
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Vetting Context (Role)</label>
                                    <select 
                                        required 
                                        value={selectedRole} 
                                        onChange={e => setSelectedRole(e.target.value)}
                                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none"
                                    >
                                        <option value="" disabled>Select Job...</option>
                                        {jobs.map(j => (
                                            <option key={j.id} value={j.title}>{j.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Date</label>
                                    <input required type="date" value={intDate} onChange={e => setIntDate(e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Time</label>
                                    <input required type="time" value={intTime} onChange={e => setIntTime(e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Synchronous Stage</label>
                                <div className="flex gap-2">
                                    {['screening', 'technical', 'final'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setIntType(type as any)}
                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                                intType === type ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl mt-4 hover:bg-primary transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {isLoading ? 'Syncing...' : 'Lock Interview Event'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Interviews;
