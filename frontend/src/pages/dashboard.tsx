import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, 
    Briefcase, 
    Clock, 
    Zap, 
    ArrowRight, 
    Plus, 
    Upload, 
    Sparkles,
    Check,
    UserPlus
} from 'lucide-react';

// --- Types ---
interface Candidate {
    id: number;
    name: string;
    stage: string;
    applied_job: string;
}

interface Job {
    id: number;
    title: string;
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [jobsRes, candidatesRes] = await Promise.all([
                    fetch('http://localhost:8001/api/v1/jobs/').catch(() => null),
                    fetch('http://localhost:8001/api/v1/candidates/').catch(() => null)
                ]);

                if (jobsRes?.ok) setJobs(await jobsRes.json());
                if (candidatesRes?.ok) setCandidates(await candidatesRes.json());
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            } finally {
            }
        };
        fetchData();
        
        const handleSync = () => fetchData();
        window.addEventListener('drive-synced', handleSync);
        return () => window.removeEventListener('drive-synced', handleSync);
    }, []);

    const stats = [
        { label: 'Open Positions', value: jobs.length, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+2' },
        { label: 'Total Candidates', value: candidates.length, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50', trend: '+12%' },
        { label: 'Avg. Time to Hire', value: '14 days', icon: Clock, color: 'text-sky-600', bg: 'bg-sky-50', trend: 'Stable' },
        { label: 'AI Match Accuracy', value: '92%', icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+5%' },
    ];

    return (
        <div className="px-8 py-6 animate-fade-in">
            {/* Hero Section */}
            <section className="mb-10 relative overflow-hidden bg-white rounded-2xl border border-bdr p-10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px]"></div>
                <div className="relative max-w-3xl">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="badge bg-primary/10 text-primary border-primary/20">
                            <Sparkles className="w-3 h-3 mr-1.5" />AI-Powered Recruitment
                        </span>
                        <span className="badge bg-emerald-50 text-emerald-700 border-emerald-100">Active</span>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-txt-primary mb-4">
                        Intelligent Hiring, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Reimagined for the Future.</span>
                    </h1>
                    <p className="text-lg text-txt-secondary mb-8 max-w-xl">
                        Streamline your workflow with automated candidate screening, real-time analytics, and seamless collaboration tools.
                    </p>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/candidates')} className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary/20">
                            Manage Candidates
                        </button>
                        <button onClick={() => navigate('/jobs')} className="px-6 py-3 bg-white hover:bg-base text-txt-primary font-semibold rounded-xl border border-bdr transition-all">
                            View Positions
                        </button>
                    </div>
                </div>
            </section>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {stats.map((stat, i) => (
                    <div key={i} className="stat-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <span className="text-xs font-bold text-success flex items-center gap-1">{stat.trend}</span>
                        </div>
                        <p className="text-3xl font-bold text-txt-primary">{stat.value}</p>
                        <p className="text-sm font-medium text-txt-muted mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                {/* Pipeline Chart Card */}
                <div className="lg:col-span-2 bg-surface rounded-2xl border border-bdr p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-semibold text-txt-primary">Hiring Pipeline</h3>
                            <p className="text-sm text-txt-muted mt-0.5">Candidates distribution across stages</p>
                        </div>
                        <button className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                            Analyze Report <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-6">
                        {['Applied', 'Screening', 'Interview', 'Assessment', 'Offer'].map((stage, idx) => {
                            const count = candidates.filter(c => (c.stage || 'Applied').toLowerCase() === stage.toLowerCase()).length;
                            const max = Math.max(...['Applied', 'Screening', 'Interview', 'Assessment', 'Offer'].map(s => candidates.filter(c => (c.stage || 'Applied').toLowerCase() === s.toLowerCase()).length), 1);
                            const pct = (count / max) * 100;
                            const colors = ['bg-primary', 'bg-secondary', 'bg-tertiary', 'bg-warning', 'bg-success'];
                            return (
                                <div key={stage}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2.5 h-2.5 rounded-full ${colors[idx]}`}></div>
                                            <span className="text-sm font-medium text-txt-secondary">{stage}</span>
                                        </div>
                                        <span className="text-sm font-bold text-txt-primary">{count}</span>
                                    </div>
                                    <div className="h-3 bg-base rounded-full overflow-hidden">
                                        <div className={`h-full ${colors[idx]} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Activity Feed Card */}
                <div className="bg-surface rounded-2xl border border-bdr p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-txt-primary">Recent Activity</h3>
                        <button className="text-xs font-bold text-primary hover:underline uppercase tracking-wider">All Activity</button>
                    </div>
                    <div className="space-y-6">
                        {candidates.slice(0, 5).map((c, i) => (
                            <div key={c.id} className="flex gap-4 group">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${i === 0 ? 'bg-success/10 border-success/20 text-success' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                                    {i === 0 ? <Check className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm text-txt-primary leading-snug">
                                        <span className="font-bold">{c.name}</span> {i === 0 ? 'was advanced to' : 'applied for'} 
                                        <span className={`font-bold ml-1 ${i === 0 ? 'text-success' : 'text-primary'}`}>{i === 0 ? 'Offer Stage' : (c.applied_job || 'Frontend Developer')}</span>
                                    </p>
                                    <p className="text-xs text-txt-muted mt-1">{i + 1} hour{i > 0 ? 's' : ''} ago</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl border border-primary/10 p-8 flex items-center justify-between shadow-sm">
                <div>
                    <h3 className="text-lg font-semibold text-txt-primary">Quick Management</h3>
                    <p className="text-sm text-txt-muted mt-1">Accelerate your hiring process with AI tools</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-5 py-2.5 bg-white hover:bg-base text-sm font-semibold rounded-xl border border-bdr transition-all flex items-center gap-2 text-txt-primary">
                        <Plus className="w-4 h-4" />New Candidate
                    </button>
                    <button className="px-5 py-2.5 bg-white hover:bg-base text-sm font-semibold rounded-xl border border-bdr transition-all flex items-center gap-2 text-txt-primary">
                        <Upload className="w-4 h-4" />Bulk Import
                    </button>
                    <button className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-sm font-semibold rounded-xl transition-all flex items-center gap-2 text-white shadow-lg shadow-primary/20">
                        <Sparkles className="w-4 h-4" />Run AI Vetting
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
