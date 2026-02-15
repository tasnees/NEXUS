
import React, { useEffect, useState } from 'react';

// Job Card Interface
interface JobPosting {
    id: string;
    title: string;
    companyLogo: string;
    location: string;
    postedAt: string;
    status: 'Live Posting' | 'Action Required' | 'Draft' | 'Archived';
    applicants: number;
    matchRate: number;
    interviewed: number;
    tags: string[];
}

const JobPostingFeed: React.FC = () => {
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Dynamically load Google Fonts for Material Symbols if not already present
    useEffect(() => {
        const linkId = 'material-symbols-font';
        if (!document.getElementById(linkId)) {
            const link = document.createElement('link');
            link.id = linkId;
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
            document.head.appendChild(link);
        }

        // Fetch jobs from backend
        const fetchJobs = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/v1/jobs/');
                if (!response.ok) throw new Error('Failed to fetch jobs');
                const data = await response.json();
                
                // Map backend snake_case to frontend camelCase
                const mappedJobs = data.map((job: any) => ({
                    id: job.id.toString(),
                    title: job.title,
                    companyLogo: job.company_logo,
                    location: job.location,
                    postedAt: job.posted_at,
                    status: job.status,
                    applicants: job.applicants,
                    matchRate: job.match_rate,
                    interviewed: job.interviewed,
                    tags: job.tags || []
                }));
                setJobs(mappedJobs);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    return (
        <div className="min-h-screen bg-background font-sans text-header antialiased">
            {/* Navigation */}
            <nav className="bg-header text-white sticky top-0 z-50 shadow-lg border-b border-primary/20">
                <div className="max-w-[1440px] mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-12">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center shadow-inner">
                                <span className="material-symbols-outlined text-white">neurology</span>
                            </div>
                            <span className="text-2xl font-extrabold tracking-tight">RECRUIT<span className="text-secondary text-lg">AI</span></span>
                        </div>
                        <div className="hidden lg:flex items-center gap-8 text-[15px] font-medium">
                            <a href="#" className="text-white border-b-2 border-secondary pb-1">Dashboard</a>
                            <a href="#" className="text-secondary hover:text-white transition-colors">Talent Pool</a>
                            <a href="#" className="text-secondary hover:text-white transition-colors">Analytics</a>
                            <a href="#" className="text-secondary hover:text-white transition-colors">Automation</a>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="relative group hidden md:block">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary/60 text-xl">search</span>
                            <input 
                                type="text" 
                                placeholder="Search postings or candidates..." 
                                className="bg-[#24334d] border-none rounded-lg pl-11 pr-4 py-2.5 text-sm w-72 focus:ring-2 focus:ring-secondary/50 transition-all placeholder:text-secondary/50 text-white"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors relative">
                                <span className="material-symbols-outlined">notifications</span>
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-header"></span>
                            </button>
                            <div className="h-10 w-[1px] bg-white/10 mx-2"></div>
                            <div className="flex items-center gap-3 cursor-pointer group">
                                <div className="text-right hidden sm:block">
                                    <div className="text-xs font-bold text-white leading-none">Sarah Jenkins</div>
                                    <div className="text-[10px] text-secondary font-bold uppercase tracking-wider">Senior Recruiter</div>
                                </div>
                                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-secondary/30 ring-2 ring-transparent group-hover:ring-secondary/50 transition-all">
                                    <img 
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBN44XhRrUZ5Rhi4R-8BlXAD0iOXxn3iO7fzfVo9KJE_76Q7I8IqLCn1sc90ByAluXvbBL6cB4XQ33rho80EDOxGOXqMgOCZpNenacLC4A7xERvdoeIKXs-GajIgRSH1HunmJoJmZruSn2TQpdzi5B6xzgDdXOiiG5Tz3Qpjha1n7zf64BKXbaJ_11YGEMqgprZJ1GxOoBjD5cXnUerxdn5JDWvQxpbQMbHCmYtr4bL5X8zgcNsdVtZTOet9lpLTAmRCXtWsZkOFfdk" 
                                        alt="Profile" 
                                        className="w-full h-full object-cover" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-[1440px] mx-auto px-6 py-10 flex gap-8">
                {/* Sidebar */}
                <aside className="w-72 flex-shrink-0 space-y-6 hidden md:block">
                    <button className="w-full bg-primary hover:bg-navy-deep text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-primary/20 transition-all group">
                        <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">bolt</span>
                        Post New Job (AI)
                    </button>
                    
                    <div className="bg-surface p-6 rounded-xl shadow-sm border border-secondary/10">
                        <h3 className="text-xs font-bold uppercase tracking-widest mb-5 text-secondary">Recruitment Tools</h3>
                        <nav className="space-y-1">
                            <a href="#" className="flex items-center gap-3 p-3 rounded-lg bg-background text-primary font-bold transition-all">
                                <span className="material-symbols-outlined text-xl">dashboard</span>
                                <span className="text-sm">Active Postings</span>
                            </a>
                            <a href="#" className="flex items-center gap-3 p-3 rounded-lg text-secondary hover:bg-background/50 hover:text-header transition-all">
                                <span className="material-symbols-outlined text-xl">account_tree</span>
                                <span className="text-sm">Hiring Pipeline Status</span>
                            </a>
                            <a href="#" className="flex items-center gap-3 p-3 rounded-lg text-secondary hover:bg-background/50 hover:text-header transition-all">
                                <span className="material-symbols-outlined text-xl">settings_input_component</span>
                                <span className="text-sm">Automation (n8n)</span>
                            </a>
                            <a href="#" className="flex items-center gap-3 p-3 rounded-lg text-secondary hover:bg-background/50 hover:text-header transition-all">
                                <span className="material-symbols-outlined text-xl">history_edu</span>
                                <span className="text-sm">AI Interview Logs</span>
                            </a>
                        </nav>
                    </div>

                    <div className="bg-surface p-6 rounded-xl shadow-sm border border-secondary/10">
                        <h3 className="text-xs font-bold uppercase tracking-widest mb-5 text-secondary">Hiring Status</h3>
                        <div className="space-y-4">
                            <label className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-secondary/30 text-primary focus:ring-primary/20 bg-background" />
                                    <span className="text-sm font-medium text-header/80 group-hover:text-primary transition-colors">Published</span>
                                </div>
                                <span className="text-[10px] bg-background px-2 py-0.5 rounded-full font-bold opacity-60 text-header">12</span>
                            </label>
                            <label className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" className="w-5 h-5 rounded border-secondary/30 text-primary focus:ring-primary/20 bg-background" />
                                    <span className="text-sm font-medium text-header/80 group-hover:text-primary transition-colors">Drafts</span>
                                </div>
                                <span className="text-[10px] bg-background px-2 py-0.5 rounded-full font-bold opacity-60 text-header">4</span>
                            </label>
                            <label className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" className="w-5 h-5 rounded border-secondary/30 text-primary focus:ring-primary/20 bg-background" />
                                    <span className="text-sm font-medium text-header/80 group-hover:text-primary transition-colors">Archived</span>
                                </div>
                                <span className="text-[10px] bg-background px-2 py-0.5 rounded-full font-bold opacity-60 text-header">45</span>
                            </label>
                        </div>
                    </div>

                    <div className="pt-2">
                        <div className="bg-navy-deep p-6 rounded-xl text-white">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-xl text-secondary">speed</span>
                                <span className="text-xs font-bold uppercase tracking-wider text-secondary">Pipeline Health</span>
                            </div>
                            <div className="flex items-end gap-2 mb-1">
                                <div className="text-3xl font-bold">88%</div>
                                <div className="text-[10px] text-emerald-400 font-bold mb-1.5">+5.2%</div>
                            </div>
                            <p className="text-[11px] text-secondary leading-relaxed mb-5">
                                Your automated vetting pipelines are processing candidates 14% faster than last month.
                            </p>
                            <div className="w-full bg-white/10 h-1.5 rounded-full mb-6">
                                <div className="bg-secondary h-full rounded-full w-[88%]"></div>
                            </div>
                            <button className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-secondary transition-colors">Optimize n8n Nodes</button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <section className="flex-grow">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold text-header mb-2 tracking-tight">Active Job Postings Management</h1>
                            <p className="text-secondary font-medium">Monitoring 12 live postings and AI-driven candidate ranking.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-secondary">Sort:</span>
                                <select className="bg-surface border-secondary/20 rounded-lg text-sm font-semibold text-header focus:ring-primary/20 px-4 pr-10 py-2.5 cursor-pointer shadow-sm">
                                    <option>Highest Match Rate</option>
                                    <option>Most Recent</option>
                                    <option>Total Applicants</option>
                                </select>
                            </div>
                            <button className="p-2.5 bg-surface border border-secondary/20 rounded-lg text-secondary hover:text-primary transition-colors shadow-sm">
                                <span className="material-symbols-outlined">filter_list</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-5">
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-20 text-secondary">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                                <p className="font-bold uppercase tracking-widest text-[10px]">Synchronizing with AI Nodes...</p>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 p-8 rounded-xl text-center">
                                <span className="material-symbols-outlined text-red-400 text-4xl mb-3">error</span>
                                <h3 className="text-red-800 font-bold mb-1">Backend Connection Failed</h3>
                                <p className="text-red-600 text-sm mb-4">{error}</p>
                                <button 
                                    onClick={() => window.location.reload()} 
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-red-200"
                                >
                                    Retry Connection
                                </button>
                            </div>
                        )}

                        {!loading && !error && jobs.length === 0 && (
                            <div className="bg-surface border border-dashed border-secondary/30 p-20 rounded-xl text-center">
                                <span className="material-symbols-outlined text-secondary/40 text-6xl mb-4">description</span>
                                <h3 className="text-header font-bold mb-1 text-xl">No Active Postings</h3>
                                <p className="text-secondary max-w-xs mx-auto">Your pipeline is currently clear. Ready to source some talent?</p>
                            </div>
                        )}

                        {!loading && !error && jobs.map((job: JobPosting) => (
                            <div key={job.id} className="bg-surface p-7 rounded-xl border border-secondary/20 shadow-sm relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]">
                                <div className="flex flex-col sm:flex-row gap-6">
                                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-background flex-shrink-0 border border-secondary/10">
                                        <img src={job.companyLogo} alt="Company Logo" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h2 className="text-xl font-bold text-header group-hover:text-primary transition-colors cursor-pointer">{job.title}</h2>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-sm font-semibold text-secondary flex items-center gap-1.5">
                                                        <span className="material-symbols-outlined text-[16px]">{job.location === 'Remote' ? 'cloud' : job.location.includes('UK') ? 'apartment' : 'location_on'}</span> {job.location}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-secondary/40"></span>
                                                    <span className="text-sm font-medium text-secondary">{job.postedAt}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                {job.status === 'Live Posting' && (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wider border border-emerald-100">
                                                        <span className="material-symbols-outlined text-sm">check_circle</span> Live Posting
                                                    </span>
                                                )}
                                                {job.status === 'Action Required' && (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold uppercase tracking-wider border border-amber-100">
                                                        <span className="material-symbols-outlined text-sm">schedule</span> Action Required
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 my-5 py-4 border-y border-background">
                                            <div className="text-center border-r border-background">
                                                <div className="text-lg font-extrabold text-header">{job.applicants}</div>
                                                <div className="text-[10px] text-secondary font-bold uppercase tracking-widest">Applicants</div>
                                            </div>
                                            <div className="text-center border-r border-background">
                                                <div className="text-lg font-extrabold text-primary">{job.matchRate}%</div>
                                                <div className="text-[10px] text-secondary font-bold uppercase tracking-widest">Avg. Match Rate</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-lg font-extrabold text-header">{job.interviewed}</div>
                                                <div className="text-[10px] text-secondary font-bold uppercase tracking-widest">
                                                    {job.status === 'Action Required' ? 'New Vetted' : 'Interviewed'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                            <div className="flex gap-2">
                                                {job.tags.map((tag: string, i: number) => (
                                                    <span key={i} className="px-3 py-1.5 rounded-lg bg-background text-header/80 text-[12px] font-bold border border-secondary/10">{tag}</span>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button className="px-5 py-2.5 rounded-lg border border-secondary/30 text-header text-sm font-bold hover:bg-background transition-all">Manage Post</button>
                                                <button className="px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-header transition-all shadow-md shadow-primary/10">View Candidates</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="mt-12 flex justify-center items-center gap-4">
                        <button className="px-4 py-2 flex items-center gap-2 rounded-lg border border-secondary/30 text-header font-bold hover:bg-surface transition-colors disabled:opacity-30" disabled>
                            <span className="material-symbols-outlined text-lg">chevron_left</span> Previous
                        </button>
                        <div className="flex items-center gap-2">
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-white font-bold shadow-md shadow-primary/20">1</button>
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface text-header font-bold transition-colors">2</button>
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface text-header font-bold transition-colors">3</button>
                            <span className="px-2 text-secondary font-bold">...</span>
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface text-header font-bold transition-colors">12</button>
                        </div>
                        <button className="px-4 py-2 flex items-center gap-2 rounded-lg border border-secondary/30 text-header font-bold hover:bg-surface transition-colors">
                            Next <span className="material-symbols-outlined text-lg">chevron_right</span>
                        </button>
                    </div>
                </section>
            </main>

            {/* Floating Widget */}
            <div className="fixed bottom-10 right-10 bg-header text-white border border-white/10 p-5 rounded-2xl shadow-2xl w-80 hidden xl:block">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-secondary">Vetting Engine Online</span>
                    </div>
                    <button className="text-white/40 hover:text-white"><span className="material-symbols-outlined text-lg">close</span></button>
                </div>
                <div className="h-36 bg-navy-deep rounded-xl overflow-hidden relative border border-white/5">
                    <img 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdX4My7xM2JDOegj_a2eCQzPOGJeN3fWuFoHp8CWrfX4at9fP2eEsFGV_idBhE0lwt8jYnAdBUHiKicaG-dtM6pJ9VTk4ubixfhVCQHbL6naLKjkE6eaavuqZ7sE6xu_A1H9v_eyNwTRAslr3tmbEAdS7WECTpVt1ejrlLVkg_9F0n0UibmwfyKxLL5lHdjP9xWHo_Gsm3fU-V_1ZxoD3K4zF3OYoN6CVyCgx6240LFP1O-OXmmMOPmubJrZwiBU3kM9jnw6QcUvlI" 
                        alt="Network Map" 
                        className="w-full h-full object-cover opacity-30 grayscale contrast-125" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-deep to-transparent"></div>
                    <div className="absolute top-1/2 left-1/3 w-3 h-3 bg-secondary rounded-full shadow-[0_0_15px_#778DA9]"></div>
                    <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-secondary/40 rounded-full"></div>
                    <div className="absolute bottom-1/3 right-1/2 w-2 h-2 bg-secondary/60 rounded-full"></div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                    <div>
                        <div className="text-xl font-bold">1,248</div>
                        <div className="text-[10px] text-secondary font-bold uppercase tracking-tight">AI Screened this week</div>
                    </div>
                    <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-secondary">monitoring</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JobPostingFeed;
