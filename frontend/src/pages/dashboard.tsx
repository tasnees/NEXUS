import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Data states
    const [jobs, setJobs] = useState<any[]>([]);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [interviews, setInterviews] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [jobsRes, candidatesRes, interviewsRes] = await Promise.all([
                    fetch('http://localhost:8001/api/v1/jobs/').catch(() => null),
                    fetch('http://localhost:8001/api/v1/candidates/').catch(() => null),
                    fetch('http://localhost:8001/api/v1/interviews/').catch(() => null)
                ]);
                
                if (jobsRes && jobsRes.ok) {
                    const data = await jobsRes.json();
                    setJobs(Array.isArray(data) ? data : []);
                }
                if (candidatesRes && candidatesRes.ok) {
                    const data = await candidatesRes.json();
                    setCandidates(Array.isArray(data) ? data : []);
                }
                if (interviewsRes && interviewsRes.ok) {
                    const data = await interviewsRes.json();
                    setInterviews(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            }
        };
        fetchDashboardData();
    }, []);
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        salary: '',
        timePerWeek: '',
        nature: 'hybrid',
        requirements: '',
        description: '',
        tags: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await fetch('https://hook.eu1.make.com/wyv5w8y6awvl56u2y5a253680ndkrqyx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    postedAt: new Date().toISOString(),
                    status: 'Live',
                    tags: formData.tags.split(',').map(tag => tag.trim())
                }),
            });
            if (response.ok) {
                setIsModalOpen(false);
                setFormData({
                    title: '',
                    company: '',
                    salary: '',
                    timePerWeek: '',
                    nature: 'hybrid',
                    requirements: '',
                    description: '',
                    tags: ''
                });
                // Small delay to let the modal animation finish if any
                setTimeout(() => {
                    // Success!
                }, 100);
            }
        } catch (error) {
            console.error('Error posting job:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto">

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#f0f1f0]">
                <header className="relative h-72 flex flex-col justify-end px-12 pb-12 hero-banner">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#f0f1f0] via-transparent to-transparent"></div>
                    <div className="relative z-10 flex items-end justify-between w-full">
                        <div className="max-w-2xl">
                            <nav className="flex gap-2 mb-4">
                                <span className="px-3 py-1 bg-primary/30 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">Automated Pipeline</span>
                                <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">Active Now</span>
                            </nav>
                            <h1 className="text-4xl font-display font-bold text-white drop-shadow-lg mb-2">Recruitment Overview</h1>
                            <p className="text-slate-200 text-lg font-medium opacity-90">Welcome back, Marcus. Your AI agents analyzed 124 candidates this morning.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/60">search</span>
                                <input 
                                    className="pl-12 pr-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-sm text-white placeholder-white/60 focus:ring-2 focus:ring-white/30 w-72 outline-none transition-all" 
                                    placeholder="Find candidates, jobs..." 
                                    type="text"
                                />
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-xl transition-all transform hover:-translate-y-0.5"
                            >
                                <span className="material-symbols-outlined text-xl">add_circle</span>
                                Post New Job
                            </button>
                        </div>
                    </div>
                </header>

                <div className="px-12 -mt-8 pb-12 space-y-8 relative z-20">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-soft border border-white flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined">person_search</span>
                                </div>
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold">+12%</span>
                            </div>
                            <div className="mt-4">
                                <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Total Applicants</p>
                                <h3 className="text-3xl font-display font-bold text-slate-800 mt-1">{candidates.length}</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-soft border border-white flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined">target</span>
                                </div>
                                <span className="bg-primary/10 text-primary px-2 py-1 rounded-lg text-xs font-bold">98.2%</span>
                            </div>
                            <div className="mt-4">
                                <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">AI Matching Accuracy</p>
                                <h3 className="text-3xl font-display font-bold text-slate-800 mt-1">Optimized</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-soft border border-white flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined">avg_time</span>
                                </div>
                                <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-xs font-bold">-4 Days</span>
                            </div>
                            <div className="mt-4">
                                <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Avg. Time to Hire</p>
                                <h3 className="text-3xl font-display font-bold text-slate-800 mt-1">14 Days</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-soft border border-white flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined">rocket_launch</span>
                                </div>
                                <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded-lg text-xs font-bold">Active</span>
                            </div>
                            <div className="mt-4">
                                <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">AI Sourcing Agents</p>
                                <h3 className="text-3xl font-display font-bold text-slate-800 mt-1">{jobs.length}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white rounded-3xl shadow-soft border border-white overflow-hidden">
                                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary">contract</span>
                                        <h2 className="text-xl font-display font-bold text-slate-800">Active AI-Driven Postings</h2>
                                    </div>
                                    <button 
                                        onClick={() => navigate('/jobs')}
                                        className="text-primary text-sm font-bold hover:underline underline-offset-4 tracking-tight"
                                    >
                                        View All Pipeline
                                    </button>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {jobs.slice(0, 3).map((job: any) => (
                                        <div key={job.id} onClick={() => navigate('/jobs')} className="p-8 flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer group">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined text-2xl">developer_mode_tv</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-lg">{job.title}</h4>
                                                    <p className="text-sm text-slate-500 font-medium">{job.company || 'Nexus AI Corp'} • <span className="text-primary">{Math.floor(Math.random() * 50) + 10} Matches</span></p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                                    Auto-Optimizing
                                                </span>
                                                <button className="p-2 hover:bg-slate-200 rounded-xl text-slate-400">
                                                    <span className="material-symbols-outlined">more_horiz</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {jobs.length === 0 && (
                                        <div className="p-8 text-center text-slate-500 font-medium">No active jobs found.</div>
                                    )}
                                </div>
                            </div>

                            {/* Candidate Pipeline Overview */}
                            <div className="bg-white rounded-3xl shadow-soft border border-white p-8">
                                <div className="flex items-center gap-3 mb-8">
                                    <span className="material-symbols-outlined text-primary">account_tree</span>
                                    <h2 className="text-xl font-display font-bold text-slate-800">Candidate Pipeline Overview</h2>
                                </div>
                                <div className="grid grid-cols-4 gap-6">
                                    {/* Pipeline Column 1 */}
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 relative group overflow-hidden">
                                        <div className="relative z-10">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sourcing</p>
                                            <p className="text-3xl font-display font-bold text-slate-800">{candidates.length}</p>
                                            <div className="mt-4 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div className="w-full h-full bg-primary"></div>
                                            </div>
                                        </div>
                                        <div className="absolute -right-2 -bottom-2 opacity-5 scale-150">
                                            <span className="material-symbols-outlined text-8xl">search_check</span>
                                        </div>
                                    </div>
                                    {/* Pipeline Column 2 */}
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 relative group overflow-hidden">
                                        <div className="relative z-10">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">AI Assessed</p>
                                            <p className="text-3xl font-display font-bold text-slate-800">{Math.floor(candidates.length * 0.45)}</p>
                                            <div className="mt-4 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div className="w-2/3 h-full bg-primary"></div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Pipeline Column 3 */}
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 relative group overflow-hidden">
                                        <div className="relative z-10">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Interviews</p>
                                            <p className="text-3xl font-display font-bold text-slate-800">{interviews.length}</p>
                                            <div className="mt-4 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div className="w-1/3 h-full bg-primary"></div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Pipeline Column 4 */}
                                    <div className="bg-primary/5 p-5 rounded-2xl border border-primary/20 relative group overflow-hidden">
                                        <div className="relative z-10">
                                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Hired</p>
                                            <p className="text-3xl font-display font-bold text-primary">08</p>
                                            <div className="mt-4 w-full h-1.5 bg-primary/20 rounded-full overflow-hidden">
                                                <div className="w-1/5 h-full bg-primary"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar Columns */}
                        <div className="space-y-8">
                            <div className="bg-dark-sidebar rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative group">
                                <div className="absolute inset-0 texture-overlay opacity-5"></div>
                                <div className="relative z-10 p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-lg font-display font-bold text-white tracking-tight">AI Engine Health</h3>
                                        <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 group-hover:border-primary/60 transition-colors">
                                            <span className="material-symbols-outlined text-primary text-2xl">memory</span>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between text-[11px] mb-2">
                                                <span className="text-accent uppercase font-bold tracking-widest">Matching Intelligence</span>
                                                <span className="text-white font-bold">94.8%</span>
                                            </div>
                                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div className="w-[94%] h-full bg-primary shadow-[0_0_12px_rgba(65,90,119,0.5)]"></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[11px] mb-2">
                                                <span className="text-accent uppercase font-bold tracking-widest">Sentiment Accuracy</span>
                                                <span className="text-white font-bold">89.2%</span>
                                            </div>
                                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div className="w-[89%] h-full bg-primary shadow-[0_0_12px_rgba(65,90,119,0.5)]"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => navigate('/sentiment-analysis')}
                                        className="w-full mt-8 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-primary/20"
                                    >
                                        Optimization Lab
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl shadow-soft border border-white p-8">
                                <h3 className="text-lg font-display font-bold text-slate-800 mb-6 flex items-center justify-between">
                                    AI Power Matches
                                    <span className="material-symbols-outlined text-accent text-xl">verified_user</span>
                                </h3>
                                <div className="space-y-6">
                                    {candidates.slice(0, 3).map((candidate: any, idx: number) => {
                                        const fitScore = idx === 0 ? '98%' : idx === 1 ? '92%' : '87%';
                                        const badgeColor = idx === 0 ? 'bg-green-500' : idx === 1 ? 'bg-blue-500' : 'bg-amber-500';
                                        return (
                                            <div key={candidate.id} onClick={() => navigate(`/candidate/${candidate.id}`)} className="flex items-center gap-4 group cursor-pointer">
                                                <div className="relative">
                                                    <img 
                                                        alt={candidate.name} 
                                                        className="w-12 h-12 rounded-2xl object-cover shadow-md" 
                                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name || 'A')}&background=random`}
                                                    />
                                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${badgeColor}`}></div>
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-sm font-bold text-slate-800 truncate">{candidate.name}</p>
                                                    <p className="text-[11px] text-primary font-bold">{fitScore} Fit • {candidate.skills?.[0] || 'Applicant'}</p>
                                                </div>
                                                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                                    <span className="material-symbols-outlined text-slate-400 text-lg">chat_bubble</span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {candidates.length === 0 && (
                                        <div className="text-center text-slate-500 font-medium text-sm py-4">No candidates processed yet.</div>
                                    )}
                                </div>
                                <button 
                                    onClick={() => navigate('/candidates')}
                                    className="w-full mt-8 py-3 text-xs font-bold border border-slate-100 text-slate-500 rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest"
                                >
                                    View All Activity
                                </button>
                            </div>

                            <div className="bg-gradient-to-br from-primary to-[#1B263B] rounded-3xl p-8 text-white shadow-2xl shadow-primary/20 overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                                <div className="relative z-10">
                                    <h4 className="text-xl font-display font-bold mb-3 tracking-tight">Scale Autonomously</h4>
                                    <p className="text-sm text-slate-300 leading-relaxed mb-8 font-medium">Allow AI agents to scout, screen, and schedule candidates while you sleep.</p>
                                    <button className="w-full bg-white text-dark-sidebar font-bold py-3 rounded-xl text-sm hover:shadow-xl transition-all active:scale-95">Enable Outbound AI</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Post Job Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-dark-sidebar/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative w-full max-w-2xl bg-white dark:bg-dark-sidebar rounded-[2rem] shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300">
                        <div className="absolute inset-0 texture-overlay pointer-events-none opacity-[0.05]"></div>
                        
                        <div className="relative p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                    <span className="material-symbols-outlined">rocket_launch</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-display font-bold text-slate-800 dark:text-white">Post New NEXUS Job</h2>
                                    <p className="text-xs text-slate-500 font-medium tracking-tight">Initialize AI-driven sourcing agents</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors">
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="relative p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 dark:text-accent uppercase tracking-widest pl-1">Job Title / Post</label>
                                    <input 
                                        required
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Senior Frontend Engineer" 
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 dark:text-accent uppercase tracking-widest pl-1">Company Name</label>
                                    <input 
                                        required
                                        name="company"
                                        value={formData.company}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Nexus AI Corp" 
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 dark:text-accent uppercase tracking-widest pl-1">Salary Range</label>
                                    <input 
                                        name="salary"
                                        value={formData.salary}
                                        onChange={handleInputChange}
                                        placeholder="e.g. $120k - $160k" 
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 dark:text-accent uppercase tracking-widest pl-1">Time per Week</label>
                                    <input 
                                        name="timePerWeek"
                                        value={formData.timePerWeek}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 40 hrs" 
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 dark:text-accent uppercase tracking-widest pl-1">Nature</label>
                                    <select 
                                        name="nature"
                                        value={formData.nature}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white appearance-none"
                                    >
                                        <option value="onsite">Onsite</option>
                                        <option value="online">Online / Remote</option>
                                        <option value="hybrid">Hybrid</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 dark:text-accent uppercase tracking-widest pl-1">Company Requirements</label>
                                <textarea 
                                    name="requirements"
                                    value={formData.requirements}
                                    onChange={handleInputChange}
                                    rows={3}
                                    placeholder="List the key requirements for the candidate..." 
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 dark:text-accent uppercase tracking-widest pl-1">Job Description</label>
                                <textarea 
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    placeholder="Detailed job description..." 
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 dark:text-accent uppercase tracking-widest pl-1">Skills & Tags (Comma separated)</label>
                                <input 
                                    name="tags"
                                    value={formData.tags}
                                    onChange={handleInputChange}
                                    placeholder="React, TypeScript, AI, UI/UX" 
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                />
                            </div>
                        </form>

                        <div className="relative p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/1 flex gap-4">
                            <button 
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-3 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-bold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex-[2] bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl text-sm shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Deploying Pipeline...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-lg group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">publish</span>
                                        Launch Job Posting
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
