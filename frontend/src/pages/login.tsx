import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';
import { LayoutDashboard, Rocket, Shield, ArrowRight, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('recruiter');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:8001/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Authentication failed');

            login(data.role || role); 
            navigate('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#f6fafe] min-h-screen flex items-center justify-center p-4 lg:p-8 antialiased font-sans">
            <div className="w-full max-w-6xl bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgb(0,0,0,0.08)] overflow-hidden flex flex-col lg:flex-row min-h-[700px] border border-slate-100">
                
                {/* Left Side: Hero */}
                <div className="lg:w-1/2 bg-[#004869] relative overflow-hidden flex flex-col p-8 lg:p-16 text-white shrink-0">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#712ae2] filter blur-[120px] opacity-20 -mr-48 -mt-48 rounded-full"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#003d9b] filter blur-[100px] opacity-20 -ml-40 -mb-40 rounded-full"></div>
                    
                    <div className="relative z-10 flex items-center gap-3 mb-16 lg:mb-24">
                        <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                            <LayoutDashboard className="text-white" size={24} />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-white">HireSync AI</span>
                    </div>

                    <div className="relative z-10 flex-1 flex flex-col justify-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-widest mb-6 w-fit border border-white/10 text-white">
                            <Shield size={14} className="fill-white/20" />
                            Secure Enterprise Access
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-[1.1] tracking-tight text-white">
                            Human talent, <br/><span className="text-[#c9e6ff]">augmented by AI.</span>
                        </h1>
                        <p className="text-lg text-[#c9e6ff]/80 mb-10 leading-relaxed max-w-md">
                            Bridge the gap between potential and performance with our automated assessment ecosystem.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl group hover:bg-white/10 transition-all">
                                <div className="w-8 h-8 rounded-lg bg-[#003d9b]/40 flex items-center justify-center mb-3">
                                    <Rocket size={16} className="text-white" />
                                </div>
                                <h4 className="text-white font-bold text-sm mb-1">Smart Sourcing</h4>
                                <p className="text-xs text-white/60 leading-relaxed">Discover elite talent from global networks.</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl group hover:bg-white/10 transition-all">
                                <div className="w-8 h-8 rounded-lg bg-[#712ae2]/40 flex items-center justify-center mb-3">
                                    <Shield size={16} className="text-white" />
                                </div>
                                <h4 className="text-white font-bold text-sm mb-1">Bias Removal</h4>
                                <p className="text-xs text-white/60 leading-relaxed">Automated screening for fair evaluations.</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 pt-12 flex items-center gap-4 opacity-40 grayscale contrast-125">
                        <span className="font-bold text-lg text-white italic tracking-tighter">LUMINA</span>
                        <span className="font-bold text-lg text-white italic tracking-tighter">NEXUS</span>
                        <span className="font-bold text-lg text-white italic tracking-tighter">APEX</span>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 bg-white min-w-0">
                    <div className="w-full max-w-md mx-auto">
                        <div className="mb-10">
                            <h2 className="text-3xl font-bold text-[#171c1f] mb-2 tracking-tight">Welcome back</h2>
                            <p className="text-sm text-slate-500 font-medium">Sign in to your recruitment dashboard.</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl flex items-center gap-3 text-sm animate-fade-in border border-red-100">
                                <Shield size={18} className="shrink-0" />
                                <p className="font-semibold">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-5 w-full block">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Sign in as</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#003d9b] transition-colors" size={18} />
                                    <select 
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-[#003d9b]/5 focus:border-[#003d9b] outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
                                        value={role || 'recruiter'}
                                        onChange={(e) => setRole(e.target.value as UserRole)}
                                    >
                                        <option value="recruiter">Recruiter / Talent Acquisition</option>
                                        <option value="hiring_manager">Hiring Manager</option>
                                        <option value="interviewer">Interviewer</option>
                                        <option value="hr_admin">HR Admin</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Corporate Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#003d9b] transition-colors" size={18} />
                                    <input 
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-[#003d9b]/5 focus:border-[#003d9b] outline-none transition-all text-sm font-medium" 
                                        placeholder="name@company.com" required type="email"
                                        value={email} onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
                                    <a href="#" className="text-[10px] font-bold text-[#003d9b] hover:underline">Forgot?</a>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#003d9b] transition-colors" size={18} />
                                    <input 
                                        className="w-full pl-12 pr-12 py-3.5 bg-slate-50/50 border border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-[#003d9b]/5 focus:border-[#003d9b] outline-none transition-all text-sm font-medium" 
                                        placeholder="••••••••" required type={showPassword ? "text" : "password"}
                                        value={password} onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button 
                                        type="button" 
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#003d9b] transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
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
                                        <span>Sign In to Dashboard</span>
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="text-center mt-10">
                            <p className="text-sm text-slate-500 font-medium">
                                New to HireSync? 
                                <Link className="text-[#003d9b] font-bold hover:underline ml-1.5" to="/signup">Create account</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
