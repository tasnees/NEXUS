import React from 'react';
import { useNavigate } from 'react-router-dom';

const SubmissionSuccess: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <div className="max-w-md w-full bg-white p-12 rounded-[3rem] border border-slate-200 shadow-2xl text-center space-y-8 animate-in fade-in zoom-in duration-700">
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-200">
                    <span className="material-symbols-outlined text-white text-5xl">check_circle</span>
                </div>
                
                <div className="space-y-4">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mission Accomplished</h1>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        Your technical implementation has been securely transmitted to our review team. 
                        We will analyze your solutions and get back to you soon.
                    </p>
                </div>

                <div className="pt-4">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-8">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Status</p>
                        <p className="text-emerald-600 font-bold uppercase tracking-tight">Pending Review</p>
                    </div>

                    <button 
                        onClick={() => window.close()} 
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#3B82F6] transition-all shadow-xl shadow-slate-200"
                    >
                        Close Portal
                    </button>
                    <p className="mt-4 text-[10px] text-slate-300 font-bold uppercase tracking-widest cursor-pointer hover:text-slate-500 transition-colors" onClick={() => navigate('/login')}>
                        Return to site
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SubmissionSuccess;
