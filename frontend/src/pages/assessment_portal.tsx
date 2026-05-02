import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const AssessmentPortal: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const assessmentId = searchParams.get('assessment_id');
    const candidateEmail = searchParams.get('email') || 'anonymous@example.com';
    
    const [timeLeft, setTimeLeft] = useState(7200); 
    const [isFinished, setIsFinished] = useState(false);
    const [submissionText, setSubmissionText] = useState('');
    const [assessmentData, setAssessmentData] = useState<any>(null);

    useEffect(() => {
        if (assessmentId) {
            fetch(`http://localhost:8001/api/v1/assessments/${assessmentId}`)
                .then(res => res.json())
                .then(data => {
                    setAssessmentData(data);
                    const hours = parseInt(data.duration) || 2;
                    setTimeLeft(hours * 3600);
                });
        }
    }, [assessmentId]);

    useEffect(() => {
        if (timeLeft > 0 && !isFinished) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && !isFinished) {
            handleSubmit(true);
        }
    }, [timeLeft, isFinished]);

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSubmit = async (isAutoSubmitting: boolean = false) => {
        if (isFinished) return;
        setIsFinished(true);
        try {
            await fetch('http://localhost:8001/api/v1/submissions/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assessment_id: parseInt(assessmentId || '0'),
                    candidate_email: candidateEmail,
                    answer: submissionText
                })
            });
            
            if (isAutoSubmitting) {
                alert("⏰ Time is up! Your assessment has been automatically submitted.");
            } else {
                alert("🚀 Assessment submitted successfully!");
            }
            
            navigate('/portal/success');
        } catch (err) {
            console.error("Submission failed:", err);
            setIsFinished(false);
        }
    };

    const renderFormattedText = (text: string) => {
        if (!text) return null;
        return text.split('\n').map((line, i) => {
            if (line.startsWith('###')) {
                return <h4 key={i} className="text-slate-900 font-black uppercase tracking-widest text-xs mt-6 mb-2">{line.replace('###', '').trim()}</h4>;
            }
            if (line.startsWith('-')) {
                return <li key={i} className="ml-4 list-disc text-slate-600 mb-1">{line.replace('-', '').trim()}</li>;
            }
            return <p key={i} className="mb-2 leading-relaxed">{line}</p>;
        });
    };

    if (!assessmentData) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-900 text-white font-bold animate-pulse">
                INITIALIZING VETTING ENVIRONMENT...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <header className="bg-slate-900 text-white px-8 py-4 flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#3B82F6] rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-white">neurology</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-extrabold">{assessmentData.title}</h1>
                        <div className="flex items-center gap-2">
                            <p className="text-[10px] text-[#3B82F6] font-black uppercase tracking-widest leading-none">Candidate Evaluation Portal</p>
                            <span className="text-[8px] px-2 py-0.5 bg-[#3B82F6] text-white rounded font-black uppercase tracking-tighter shadow-sm">
                                {assessmentData.required_format || 'text'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className={`flex items-center gap-6 px-6 py-2 rounded-2xl border ${timeLeft < 300 ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-white/5 border-white/10 text-white'}`}>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase opacity-60">Time Remaining</span>
                        <span className="text-2xl font-black">{formatTime(timeLeft)}</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-8 grid grid-cols-12 gap-8">
                <section className="col-span-12 lg:col-span-4 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">info</span> Challenge Brief
                            </h3>
                        <div className="prose prose-slate prose-sm text-slate-600">
                            <div className="font-medium text-slate-800 mb-8 leading-relaxed">
                                {renderFormattedText(assessmentData.description)}
                            </div>
                        </div>
                        </div>

                        {assessmentData.focus && assessmentData.focus.length > 0 && (
                            <div className="pt-8 border-t border-slate-100">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Competency Focus</h4>
                                <div className="flex flex-wrap gap-2">
                                    {assessmentData.focus.map((skill: string) => (
                                        <span key={skill} className="px-3 py-1 bg-[#3B82F6]/10 text-[#3B82F6] rounded-full text-[10px] font-black uppercase border border-[#3B82F6]/20">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {assessmentData.steps && assessmentData.steps.length > 0 && (
                            <div className="pt-8 border-t border-slate-100">
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#3B82F6] mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">list_alt</span> 
                                    Step-by-Step Requirements
                                </h4>
                                <div className="space-y-4">
                                    {assessmentData.steps.map((step: string, idx: number) => (
                                        <div key={idx} className="flex gap-4 group">
                                            <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shrink-0 group-hover:bg-[#3B82F6] transition-colors">
                                                {idx + 1}
                                            </div>
                                            <p className="text-sm text-slate-600 font-medium leading-relaxed pt-0.5">
                                                {step}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <section className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                    <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Vetting Workspace v1.02 • Format: {assessmentData.required_format || 'text'}
                            </span>
                        </div>
                        <textarea
                            value={submissionText}
                            onChange={(e) => setSubmissionText(e.target.value)}
                            className="flex-1 p-10 outline-none resize-none text-slate-800 font-mono text-sm leading-relaxed"
                            placeholder={`Your Mission: ${assessmentData.title}\n\n[REQUIRED FORMAT: ${assessmentData.required_format || 'text'}]\n\nPlease provide your implementation details, architecture notes, and any code snippets. Be as thorough as possible to demonstrate your technical depth.`}
                        />
                    </div>

                    <div className="flex justify-between items-center bg-slate-900 p-6 rounded-[2rem] border border-slate-700 shadow-xl">
                        <div className="flex items-center gap-4 pl-4">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Auto-save active • Workspace Secured</p>
                        </div>
                        <button 
                            onClick={() => handleSubmit(false)}
                            disabled={isFinished}
                            className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#3B82F6] transition-all"
                        >
                            Submit Assessment
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default AssessmentPortal;
