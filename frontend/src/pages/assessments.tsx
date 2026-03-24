import React, { useState, useEffect } from 'react';


// --- Types ---

interface Assessment {
    id: string;
    title: string;
    duration: string;
    difficulty: 'Easy' | 'Intermediate' | 'Expert';
    focus: string[];
    description: string;
}

interface JobGroup {
    jobId: number;
    jobTitle: string;
    assessments: Assessment[];
}



// --- Sub-Components ---

const AssessmentCard: React.FC<{ assessment: Assessment; onLaunch: () => void }> = ({ assessment, onLaunch }) => (
    <div className="bg-white p-6 rounded-2xl border border-accent/10 shadow-soft hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col justify-between h-full">
        <div>
            {/* ... rest of card ... */}
            <div className="flex justify-between items-start mb-4">
                <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors ${
                    assessment.difficulty === 'Expert' ? 'bg-red-50 text-red-600 border-red-100' :
                    assessment.difficulty === 'Intermediate' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                    {assessment.difficulty} Challenge
                </div>
                <div className="flex items-center gap-1 text-accent">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span className="text-[10px] font-bold">{assessment.duration}</span>
                </div>
            </div>
            <h4 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-primary transition-colors">{assessment.title}</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 line-clamp-2">{assessment.description}</p>
            
            <div className="flex flex-wrap gap-2 mb-6">
                {assessment.focus.map(skill => (
                    <span key={skill} className="px-2 py-1 bg-slate-50 text-slate-600 rounded-md text-[9px] font-bold border border-slate-100 flex items-center gap-1">
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span> {skill}
                    </span>
                ))}
            </div>
        </div>

        <button 
            onClick={onLaunch}
            className="w-full py-3 bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary transition-all active:scale-95 group/btn shadow-lg shadow-slate-200"
        >
            <span className="material-symbols-outlined text-lg group-hover/btn:rotate-12 transition-transform">bolt</span>
            Launch Assessment
        </button>
    </div>
);

// --- View Component ---

const Assessments: React.FC = () => {
    const [groups, setGroups] = useState<JobGroup[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [selection, setSelection] = useState<'manual' | 'ai' | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [title, setTitle] = useState('');
    const [targetJobId, setTargetJobId] = useState<number>(0);
    const [targetJobName, setTargetJobName] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState<'Easy' | 'Intermediate' | 'Expert'>('Intermediate');
    const [duration, setDuration] = useState('3 Hours');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Agent Config State
    const [threshold, setThreshold] = useState(80);
    const [autoReject, setAutoReject] = useState(true);

    const fetchData = async () => {
        try {
            const [jobsRes, assRes] = await Promise.all([
                fetch('http://localhost:8001/api/v1/jobs/'),
                fetch('http://localhost:8001/api/v1/assessments/')
            ]);
            
            if (jobsRes.ok && assRes.ok) {
                const jobsData = await jobsRes.json();
                const assData = await assRes.json();
                
                const newGroups: JobGroup[] = jobsData.map((job: any) => ({
                    jobId: job.id,
                    jobTitle: job.title,
                    assessments: assData.filter((a: any) => a.job_id === job.id).map((a: any) => ({
                        id: a.id.toString(),
                        title: a.title,
                        duration: a.duration,
                        difficulty: a.difficulty as any,
                        focus: a.focus,
                        description: a.description
                    }))
                }));
                setGroups(newGroups);
                if (jobsData.length > 0 && !targetJobId) {
                    setTargetJobId(jobsData[0].id);
                    setTargetJobName(jobsData[0].title);
                }
            }
        } catch (err) {
            console.error('Failed to fetch dynamic data:', err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleLaunchAssessment = async (jobTitle: string, assessment: Assessment) => {
        try {
            const response = await fetch('http://localhost:8001/api/v1/emails/launch-assessment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    job_name: jobTitle,
                    assessment_details: {
                        assessment_id: assessment.id,
                        title: assessment.title,
                        description: assessment.description,
                        duration: assessment.duration,
                        difficulty: assessment.difficulty,
                        focus_areas: assessment.focus
                    }
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                setToast({ message: `🚀 Success: ${result.message}`, type: 'success' });
            } else {
                const errorData = await response.json();
                setToast({ message: `❌ Launch Failed: ${errorData.detail || 'Server Error'}`, type: 'error' });
            }
        } catch (err) {
            console.error('Email launch failed:', err);
            setToast({ message: `❌ Connection Error: Backend server is offline.`, type: 'error' });
        }
    };

    const handleCreateTest = (jobId?: number, jobTitle?: string) => {
        setIsModalOpen(true);
        setSelection(null);
        setTitle('');
        setDescription('');
        setDifficulty('Intermediate');
        setDuration('3 Hours');
        if (jobId) setTargetJobId(jobId);
        if (jobTitle) setTargetJobName(jobTitle);
    };

    const handleAiGenerate = async () => {
        setIsGenerating(true);
        setTimeout(async () => {
            const assessmentPayload = {
                title: title || 'NEXUS AI Vetting Challenge',
                duration: duration || '3 Hours',
                difficulty: difficulty,
                focus: ['Real-world Scenarios', 'Efficiency', 'Optimization'],
                description: description || `Automated challenge generated based on job requirements.`,
                job_id: targetJobId
            };

            try {
                const response = await fetch('http://localhost:8001/api/v1/assessments/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(assessmentPayload)
                });
                
                if (response.ok) {
                    await fetchData();
                    setIsGenerating(false);
                    setIsModalOpen(false);
                    setToast({ message: "🚀 AI Assessment Generated and Saved!", type: 'success' });
                }
            } catch (err) {
                console.error(err);
                setIsGenerating(false);
            }
        }, 3000);
    };

    const handleManualSave = async () => {
        const assessmentPayload = {
            title: title || 'Custom Skills Test',
            duration: duration || '2 Hours',
            difficulty: difficulty,
            focus: ['Custom Validation', 'Hands-on'],
            description: description || 'Manual vetting challenge.',
            job_id: targetJobId
        };

        try {
            const response = await fetch('http://localhost:8001/api/v1/assessments/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(assessmentPayload)
            });
            
            if (response.ok) {
                await fetchData();
                setIsModalOpen(false);
                setToast({ message: "✅ Custom Assessment Saved!", type: 'success' });
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex-1 overflow-hidden bg-[#f0f1f0]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-12 custom-scrollbar">
                <div className="max-w-[1240px] mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                        <div className="max-w-xl">
                            <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-3">
                                Hands-on <span className="text-primary underline decoration-primary/30">Proficiency Vetting</span>
                            </h1>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                Our skills assessments simulate real-world challenges (2–4 hours). Evaluate candidate 
                                <span className="text-slate-800 font-bold"> hands-on proficiency</span> rather than just theoretical knowledge.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => handleCreateTest()}
                                className="px-6 py-3 bg-white border border-accent/20 text-slate-800 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-soft"
                            >
                                <span className="material-symbols-outlined">add_circle</span> Create Global Challenge
                            </button>
                        </div>
                    </div>

                    <div className="space-y-16">
                        {groups.map(group => (
                            <section key={group.jobTitle}>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-[2px] flex-1 bg-slate-200" />
                                    <h3 className="px-5 py-2 bg-slate-800 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                                        {group.jobTitle}
                                    </h3>
                                    <div className="h-[2px] flex-1 bg-slate-200" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {group.assessments.map(as => (
                                        <AssessmentCard 
                                            key={as.id} 
                                            assessment={as} 
                                            onLaunch={() => handleLaunchAssessment(group.jobTitle, as)}
                                        />
                                    ))}
                                    <button 
                                        onClick={() => handleCreateTest(group.jobId, group.jobTitle)}
                                        className="border-4 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-300 hover:text-primary hover:border-primary/50 transition-all group"
                                    >
                                        <span className="material-symbols-outlined text-4xl mb-2 group-hover:rotate-90 transition-transform">add</span>
                                        <span className="font-bold uppercase tracking-widest text-[10px]">Add Test for {group.jobTitle.split(' ')[0]}...</span>
                                    </button>
                                </div>
                            </section>
                        ))}
                    </div>

                    {/* Footer Info */}
                    <div className="mt-20 p-8 bg-primary/5 rounded-3xl border border-primary/10 flex items-center gap-8">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-3xl">psychology</span>
                        </div>
                        <div className="flex-1">
                            <h5 className="font-bold text-slate-800 mb-1 leading-none">Automated Submission Analysis</h5>
                            <p className="text-xs text-slate-500 font-medium">NEXUS AI automatically scores code submissions, UX prototypes, and architectural diagrams based on your company benchmarks.</p>
                        </div>
                        <button 
                            onClick={() => setIsFilterModalOpen(true)}
                            className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                        >
                            Configure Agent Filters
                        </button>
                    </div>
                </div>
            </main>

            {/* --- Add Test UI Modal --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300 backdrop-blur-md">
                    <div className="absolute inset-0 bg-slate-900/40" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 p-12">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h2 className="text-3xl font-extrabold text-slate-800 mb-2">New Assessment <span className="text-primary">Pipeline</span></h2>
                                <p className="text-slate-400 font-medium tracking-tight">Vetting for: <span className="text-slate-800 font-bold">{targetJobName}</span></p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                                <span className="material-symbols-outlined text-2xl">close</span>
                            </button>
                        </div>

                        {!selection ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <button
                                    onClick={() => setSelection('manual')}
                                    className="p-8 rounded-3xl border-2 border-slate-100 hover:border-primary/30 bg-slate-50/50 hover:bg-primary/5 transition-all text-left flex flex-col group"
                                >
                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 mb-6 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                        <span className="material-symbols-outlined text-3xl">edit_note</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">Manual Design</h3>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 flex-1">
                                        Hand-craft the challenge tasks, set specific milestones, and provide exact requirements.
                                    </p>
                                    <div className="text-primary font-bold text-sm flex items-center gap-2">
                                        Open Designer <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setSelection('ai')}
                                    className="p-8 rounded-3xl border-2 border-slate-900 bg-slate-900 text-white transition-all text-left flex flex-col relative group overflow-hidden"
                                >
                                    <div className="absolute -right-4 -bottom-4 opacity-10 blur-xl w-32 h-32 bg-primary rounded-full"></div>
                                    <div className="relative z-10">
                                        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white mb-6 shadow-[0_0_20px_rgba(65,90,119,0.4)]">
                                            <span className="material-symbols-outlined text-3xl">neurology</span>
                                        </div>
                                        <h3 className="text-xl font-bold mb-2 tracking-tight">AI Generator</h3>
                                        <p className="text-sm text-slate-400 font-medium leading-relaxed mb-8 flex-1">
                                            Describe your needs and let AI generate a customized real-world validation test.
                                        </p>
                                        <div className="text-white font-bold text-sm flex items-center gap-2 group-hover:gap-4 transition-all">
                                            Launch AI Pilot <span className="material-symbols-outlined text-lg">magic_button</span>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                                            {selection === 'ai' ? 'Optional Title' : 'Challenge Title'}
                                        </label>
                                        <input 
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                            placeholder={selection === 'ai' ? 'AI will name it if blank' : 'e.g. Distributed Cache Design'} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Estimated Time Needed</label>
                                        <input 
                                            value={duration}
                                            onChange={(e) => setDuration(e.target.value)}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                            placeholder="e.g. 4 Hours" 
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Target Difficulty</label>
                                    <div className="flex gap-2">
                                        {(['Easy', 'Intermediate', 'Expert'] as const).map((d) => (
                                            <button
                                                key={d}
                                                onClick={() => setDifficulty(d)}
                                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-tighter border transition-all ${
                                                    difficulty === d 
                                                        ? d === 'Easy' ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-200 scale-105'
                                                        : d === 'Intermediate' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-200 scale-105'
                                                        : 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-200 scale-105'
                                                        : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                                                }`}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                                        {selection === 'ai' ? 'Context for AI (Skills, Tasks, Edge-cases)' : 'Description & Tasks'}
                                    </label>
                                    <textarea 
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                        rows={4} 
                                        placeholder={selection === 'ai' ? 'Tell the AI what specifically to vet (e.g. "Focus on PostgreSQL indexing and concurrency").' : 'Detailed description of the challenge...'} 
                                    />
                                </div>

                                {isGenerating ? (
                                    <div className="flex flex-col items-center justify-center py-6">
                                        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4"></div>
                                        <p className="text-sm font-bold text-primary animate-pulse tracking-widest uppercase">AI Agent Generating Challenge...</p>
                                    </div>
                                ) : (
                                    <div className="flex gap-4 pt-4">
                                        <button onClick={() => setSelection(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">Back</button>
                                        <button 
                                            onClick={selection === 'ai' ? handleAiGenerate : handleManualSave} 
                                            className={`flex-[2] py-4 rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center gap-2 ${
                                                selection === 'ai' ? 'bg-slate-900 text-white shadow-slate-200' : 'bg-primary text-white shadow-primary/20'
                                            }`}
                                        >
                                            <span className="material-symbols-outlined">{selection === 'ai' ? 'magic_button' : 'save_as'}</span>
                                            {selection === 'ai' ? 'Initialize AI Agent' : 'Save & Publish to Pipeline'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- Configure Agent Filters Modal --- */}
            {isFilterModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300 backdrop-blur-md">
                    <div className="absolute inset-0 bg-slate-900/40" onClick={() => setIsFilterModalOpen(false)}></div>
                    <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 p-12">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Agent <span className="text-primary">Intelligence</span></h2>
                                <p className="text-slate-400 font-medium">Fine-tune how NEXUS AI grades submissions.</p>
                            </div>
                            <button onClick={() => setIsFilterModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                                <span className="material-symbols-outlined text-2xl">close</span>
                            </button>
                        </div>

                        <div className="space-y-10">
                            {/* Passing Threshold */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-black uppercase text-slate-800 tracking-widest">Passing Threshold</label>
                                    <span className="text-2xl font-black text-primary">{threshold}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={threshold} 
                                    onChange={(e) => setThreshold(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary" 
                                />
                                <p className="text-[10px] text-slate-400 font-medium">Candidates scoring below this will be flagged for manual review or auto-rejected.</p>
                            </div>

                            {/* Auto-Reject Toggle */}
                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 mb-1">Autonomous Rejection</h4>
                                    <p className="text-[10px] text-slate-400 font-medium">Instantly move poor performers to the "Archived" pool.</p>
                                </div>
                                <button 
                                    onClick={() => setAutoReject(!autoReject)}
                                    className={`w-14 h-8 rounded-full transition-all relative ${autoReject ? 'bg-primary' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${autoReject ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            {/* Focus Areas */}
                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase text-slate-800 tracking-widest">Primary Evaluation Nodes</label>
                                <div className="flex flex-wrap gap-3">
                                    {['Code Quality', 'Efficiency', 'Documentation', 'Scalability', 'Security', 'UX Precision'].map(tag => (
                                        <div key={tag} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2 cursor-pointer hover:border-primary/50 transition-all">
                                            <div className="w-2 h-2 bg-primary/20 rounded-full" />
                                            {tag}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={() => {
                                    setIsFilterModalOpen(false);
                                }}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                Apply Agent Intelligence
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Toast Notifications */}
            {toast && (
                <div className={`fixed bottom-8 right-8 z-[200] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-10 duration-500 ${
                    toast.type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white'
                }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-white/20'}`}>
                        <span className="material-symbols-outlined text-white">
                            {toast.type === 'success' ? 'rocket_launch' : 'error'}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-bold">{toast.message}</p>
                        <p className="text-[10px] opacity-70 font-medium">Auto-dismissing in 5s</p>
                    </div>
                    <button onClick={() => setToast(null)} className="ml-4 opacity-50 hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default Assessments;
