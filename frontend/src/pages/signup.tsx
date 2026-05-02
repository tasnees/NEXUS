import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Rocket, Shield, Check, ArrowRight, LayoutDashboard, User, Mail, Lock } from 'lucide-react';

const Signup: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company_name: '',
        role: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:8001/api/v1/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Signup failed');
            navigate('/jobs');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred during signup');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#f6fafe] min-h-screen flex items-center justify-center p-4 lg:p-8 antialiased font-sans">
            <div className="w-full max-w-6xl bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgb(0,0,0,0.08)] overflow-hidden flex flex-col lg:flex-row min-h-[700px] border border-slate-100">
                
                {/* Left Side: Hero */}
                <div className="lg:w-1/2 bg-[#003d9b] relative overflow-hidden flex flex-col p-8 lg:p-16 text-white shrink-0">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#712ae2] filter blur-[120px] opacity-20 -mr-48 -mt-48 rounded-full"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#004869] filter blur-[100px] opacity-20 -ml-40 -mb-40 rounded-full"></div>
                    
                    <div className="relative z-10 flex items-center gap-3 mb-16 lg:mb-24">
                        <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                            <LayoutDashboard className="text-white" size={24} />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">HireSync AI</span>
                    </div>

                    <div className="relative z-10 flex-1 flex flex-col justify-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-widest mb-6 w-fit border border-white/10">
                            <Rocket size={14} className="fill-white/20" />
                            Next-Gen Recruitment
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-[1.1] tracking-tight">
                            Hire smarter, <br/><span className="text-[#dae2ff]">not harder.</span>
                        </h1>
                        <p className="text-lg text-[#dae2ff]/80 mb-10 leading-relaxed max-w-md">
                            The intelligent layer for your hiring pipeline. Automate screenings and interviews in seconds.
                        </p>

                        <div className="space-y-5">
                            {[
                                'Automated Resume Screening',
                                'AI-Powered Job Descriptions',
                                'Real-time Pipeline Analytics'
                            ].map((item, index) => (
                                <div key={index} className="flex items-center gap-4">
                                    <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center border border-white/5">
                                        <Check size={14} className="text-white" />
                                    </div>
                                    <span className="text-sm font-semibold text-white/90">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-10 pt-12 flex items-center gap-2 text-[10px] text-[#dae2ff]/50 font-bold uppercase tracking-widest">
                        <Shield size={14} />
                        <span>Enterprise Grade Security</span>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 bg-white min-w-0">
                    <div className="w-full max-w-md mx-auto">
                        <div className="mb-10">
                            <h2 className="text-3xl font-bold text-[#171c1f] mb-2 tracking-tight">Create your account</h2>
                            <p className="text-sm text-slate-500 font-medium">Get started with your 14-day free trial.</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl flex items-center gap-3 text-sm animate-fade-in border border-red-100">
                                <Shield size={18} className="shrink-0" />
                                <p className="font-semibold">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5 w-full block">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#003d9b] transition-colors" size={18} />
                                    <input 
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-[#003d9b]/5 focus:border-[#003d9b] outline-none transition-all text-sm font-medium" 
                                        name="name" placeholder="John Doe" required type="text"
                                        value={formData.name} onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Work Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#003d9b] transition-colors" size={18} />
                                    <input 
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-[#003d9b]/5 focus:border-[#003d9b] outline-none transition-all text-sm font-medium" 
                                        name="email" placeholder="john@company.com" required type="email"
                                        value={formData.email} onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Company</label>
                                    <input 
                                        className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-[#003d9b]/5 focus:border-[#003d9b] outline-none transition-all text-sm font-medium" 
                                        name="company_name" placeholder="Acme Inc" required type="text"
                                        value={formData.company_name} onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Role</label>
                                    <select 
                                        className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-[#003d9b]/5 focus:border-[#003d9b] outline-none transition-all text-sm font-medium appearance-none cursor-pointer" 
                                        name="role" required value={formData.role} onChange={handleChange}
                                    >
                                        <option disabled value="">Select</option>
                                        <option value="ta">Talent Acq.</option>
                                        <option value="hm">HR Manager</option>
                                        <option value="rl">Lead</option>
                                        <option value="hp">People Head</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#003d9b] transition-colors" size={18} />
                                    <input 
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-[#003d9b]/5 focus:border-[#003d9b] outline-none transition-all text-sm font-medium" 
                                        name="password" placeholder="••••••••" required type="password"
                                        value={formData.password} onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <button 
                                className="w-full bg-[#003d9b] hover:bg-[#0052cc] text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-[#003d9b]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4 disabled:opacity-70" 
                                type="submit" disabled={loading}
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                                ) : (
                                    <>
                                        <span>Create Account</span>
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="text-center mt-10">
                            <p className="text-sm text-slate-500 font-medium">
                                Already using HireSync? 
                                <Link className="text-[#003d9b] font-bold hover:underline ml-1.5" to="/login">Sign in</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
