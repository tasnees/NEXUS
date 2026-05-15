import React, { useState, useEffect } from 'react';
import { 
    Download, 
    Printer, 
    Filter, 
    BarChart3, 
    CheckCircle2, 
    TrendingUp,
    Search,
    RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Interview {
    id: number;
    candidate_name: string;
    role: string;
    date: string;
    status: string;
    ai_evaluation: {
        overall_score: number;
        recommendation: string;
        is_overridden?: boolean;
    } | null;
}

const Reports: React.FC = () => {
    const navigate = useNavigate();
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchInterviews = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8001/api/v1/interviews/');
            if (response.ok) {
                const data = await response.json();
                // Only show interviews that have some AI analysis or have at least completed
                const completedOrAnalyzed = data.filter((i: any) => 
                    i.status === 'completed' || (i.ai_evaluation && i.ai_evaluation.overall_score > 0)
                );
                
                // Deduplicate by (candidate name + role), keeping the best one
                const uniqueReports = completedOrAnalyzed.reduce((acc: any[], current: any) => {
                    const key = `${current.candidate_name.toLowerCase()}_${current.role.toLowerCase()}`;
                    const existingIdx = acc.findIndex(item => `${item.candidate_name.toLowerCase()}_${item.role.toLowerCase()}` === key);
                    
                    if (existingIdx === -1) {
                        acc.push(current);
                    } else {
                        const existing = acc[existingIdx];
                        // Priority: 1. Has score, 2. Newer date
                        const currentHasScore = current.ai_evaluation?.overall_score > 0;
                        const existingHasScore = existing.ai_evaluation?.overall_score > 0;

                        if (currentHasScore && !existingHasScore) {
                            acc[existingIdx] = current;
                        } else if (currentHasScore === existingHasScore) {
                            if (new Date(current.date).getTime() > new Date(existing.date).getTime()) {
                                acc[existingIdx] = current;
                            }
                        }
                    }
                    return acc;
                }, []);

                setInterviews(uniqueReports);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInterviews();
    }, []);

    const filtered = interviews.filter(i => 
        i.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: interviews.length,
        avgScore: Math.round(interviews.reduce((acc, curr) => acc + (curr.ai_evaluation?.overall_score || 0), 0) / (interviews.length || 1)),
        hires: interviews.filter(i => i.ai_evaluation?.recommendation === 'Hire').length
    };

    return (
        <div className="flex-1 flex flex-col bg-slate-50 min-h-screen pb-12">
            {/* Header */}
            <section className="px-8 pt-8 pb-4">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Hiring Reports</h2>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Executive Summary & Audit Trail</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={fetchInterviews} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all">
                            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all shadow-xl shadow-slate-900/20">
                            <Download size={16} /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                <BarChart3 size={24} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Evaluated</p>
                        </div>
                        <h3 className="text-3xl font-black text-slate-800">{stats.total}</h3>
                        <p className="text-xs font-bold text-slate-500 mt-1">Candidates Screened by AI</p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                                <TrendingUp size={24} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Average Match</p>
                        </div>
                        <h3 className="text-3xl font-black text-slate-800">{stats.avgScore}%</h3>
                        <p className="text-xs font-bold text-slate-500 mt-1">Global Pipeline Quality</p>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                                <CheckCircle2 size={24} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hire Recommendations</p>
                        </div>
                        <h3 className="text-3xl font-black text-slate-800">{stats.hires}</h3>
                        <p className="text-xs font-bold text-slate-500 mt-1">Top Tier Talent Identified</p>
                    </div>
                </div>
            </section>

            {/* Table Section */}
            <section className="px-8">
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                        <div className="relative w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text"
                                placeholder="Search reports..."
                                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-blue-600 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-800 transition-all font-bold text-xs uppercase tracking-widest">
                            <Filter size={16} /> Advanced Filters
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Candidate</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Role</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Match Score</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verdict</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Audit Trail</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    [1, 2, 3].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={6} className="px-8 py-6 bg-slate-50/20"></td>
                                        </tr>
                                    ))
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-bold italic">
                                            No interview reports available matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map(report => (
                                        <tr key={report.id} className="hover:bg-slate-50/50 transition-all group">
                                            <td className="px-8 py-6">
                                                <p className="font-bold text-slate-800">{report.candidate_name}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: {report.id}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                    {report.role}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full ${report.ai_evaluation?.overall_score! >= 75 ? 'bg-emerald-500' : report.ai_evaluation?.overall_score! >= 50 ? 'bg-amber-500' : 'bg-slate-400'}`}
                                                            style={{ width: `${report.ai_evaluation?.overall_score || 0}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="font-black text-slate-700 text-sm">{report.ai_evaluation?.overall_score || '--'}%</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                                        report.ai_evaluation?.recommendation === 'Hire' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                                        report.ai_evaluation?.recommendation === 'Reject' ? 'bg-red-50 border-red-100 text-red-600' :
                                                        'bg-amber-50 border-amber-100 text-amber-600'
                                                    }`}>
                                                        {report.ai_evaluation?.recommendation || 'Pending'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`text-[9px] font-black uppercase flex items-center gap-1 ${report.ai_evaluation?.is_overridden ? 'text-indigo-600' : 'text-blue-600'}`}>
                                                        {report.ai_evaluation?.is_overridden ? 'Manual Verdict' : 'AI Analysis'}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400">{new Date(report.date).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => navigate('/sentiment-analysis', { state: { selectedId: report.id } })}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                        title="Deep Dive Analysis"
                                                    >
                                                        <BarChart3 size={18} />
                                                    </button>
                                                    <button className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all">
                                                        <Printer size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Reports;
