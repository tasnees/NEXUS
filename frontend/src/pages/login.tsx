import React, { useState } from 'react';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [keepLoggedIn, setKeepLoggedIn] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Login attempt:', { email, password, keepLoggedIn });
    };

    return (
        <div className="flex w-full min-h-screen bg-[var(--off-white)] dark:bg-[var(--navy-deep)] text-slate-800 dark:text-slate-200">
            {/* Left Side - Image & Branding */}
            <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden items-center justify-center">
                <img 
                    alt="Modern Office Environment" 
                    className="absolute inset-0 w-full h-full object-cover" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAS1LU5oZTxG7I7t0DmB-8EOBSR3UpzJQj72fbLmLtCx_PWWP1MuZz_H8gQudqk0TSJsffER4YB3C65NHLJ9JrPeg_z_otmaQ9430REmNUaXptLak9v1NZrPlCLt8MNR7agB9zCQPyTGgYgP-Hk-vbbW1qzzZmST5fcYhh0W7oeg5jmB6xP_nOABifG36v7kAn10kXoaxQ7Jlfbb4pPG9RDheYH02KF1PIsbcHTseM5mT6dOJvZ6chyDMnl3aQqdRd9HpPtIyJCZx4i"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-navy-deep/90 via-navy-dark/80 to-primary/40"></div>
                <div className="relative z-10 w-full max-w-2xl px-12">
                    <div className="mb-12">
                        <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 mb-6">
                            <span className="material-symbols-outlined text-accent text-sm">verified_user</span>
                            <span className="text-xs font-semibold uppercase tracking-widest text-white">Enterprise AI Recruitment</span>
                        </div>
                        <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
                            Human talent, <span className="text-accent">augmented</span> by intelligence.
                        </h1>
                        <p className="text-xl text-slate-300 max-w-lg">
                            Bridge the gap between potential and performance with our automated assessment ecosystem.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-xl">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white">groups</span>
                                </div>
                                <span className="text-white font-semibold">Diverse Sourcing</span>
                            </div>
                            <p className="text-slate-300 text-sm">Remove bias and discover elite talent from global professional networks.</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-xl">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white">psychology</span>
                                </div>
                                <span className="text-white font-semibold">Smart Assessment</span>
                            </div>
                            <p className="text-slate-300 text-sm">Validate technical skills through realistic, real-world work simulations.</p>
                        </div>
                    </div>
                    <div className="mt-16 flex flex-col space-y-4">
                        <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">Powering Modern Workforces</p>
                        <div className="flex space-x-10 items-center opacity-70">
                            <div className="h-6 w-auto flex items-center text-white font-bold text-xl tracking-tighter italic">LUMINA</div>
                            <div className="h-6 w-auto flex items-center text-white font-bold text-xl tracking-tighter italic">NEXUS</div>
                            <div className="h-6 w-auto flex items-center text-white font-bold text-xl tracking-tighter italic">APEX</div>
                            <div className="h-6 w-auto flex items-center text-white font-bold text-xl tracking-tighter italic">STRATOS</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-2/5 flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-12 bg-[var(--off-white)] dark:bg-[var(--navy-deep)]">
                <div className="max-w-md w-full mx-auto">
                    <div className="lg:hidden flex items-center mb-8">
                        <div className="w-10 h-10 bg-primary rounded flex items-center justify-center mr-3 shadow-lg">
                            <span className="material-symbols-outlined text-white">diversity_3</span>
                        </div>
                        <span className="text-2xl font-bold tracking-tighter text-navy-deep dark:text-off-white">RECRUIT.AI</span>
                    </div>
                    <div className="mb-10">
                        <h2 className="text-3xl font-bold mb-2 text-navy-deep dark:text-off-white">Welcome back</h2>
                        <p className="text-slate-600 dark:text-accent">Access your automated recruitment dashboard.</p>
                    </div>
                    <div className="flex p-1 bg-slate-200 dark:bg-navy-dark rounded-lg mb-8">
                        <button className="flex-1 py-2.5 text-sm font-bold rounded-md bg-white dark:bg-primary shadow-md text-navy-deep dark:text-white transition-all">
                            Login
                        </button>
                        <button className="flex-1 py-2.5 text-sm font-semibold rounded-md text-slate-500 dark:text-accent hover:text-navy-deep dark:hover:text-off-white transition-all">
                            Sign Up
                        </button>
                    </div>
                    
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold mb-2 text-navy-dark dark:text-accent">Corporate Email</label>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-xl">alternate_email</span>
                                </span>
                                <input 
                                    type="email" 
                                    className="block w-full pl-12 pr-4 py-3.5 bg-white dark:bg-navy-dark border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-navy-deep dark:text-off-white" 
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-bold text-navy-dark dark:text-accent">Password</label>
                                <a href="#" className="text-xs font-bold text-primary dark:text-accent hover:underline">Forgot Credentials?</a>
                            </div>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-xl">key</span>
                                </span>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    className="block w-full pl-12 pr-12 py-3.5 bg-white dark:bg-navy-dark border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-navy-deep dark:text-off-white" 
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button 
                                    type="button" 
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-primary transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <span className="material-symbols-outlined text-xl">visibility</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <input 
                                id="remember" 
                                type="checkbox" 
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary bg-white dark:bg-navy-dark"
                                checked={keepLoggedIn}
                                onChange={(e) => setKeepLoggedIn(e.target.checked)}
                            />
                            <label htmlFor="remember" className="ml-2 text-sm font-medium text-slate-600 dark:text-accent">Keep me logged in on this workstation</label>
                        </div>
                        <button 
                            type="submit" 
                            className="w-full py-4 bg-primary hover:bg-navy-dark text-white font-bold rounded-xl shadow-xl shadow-primary/20 transition-all transform active:scale-[0.99] flex items-center justify-center space-x-2"
                        >
                            <span>Sign In to Dashboard</span>
                            <span className="material-symbols-outlined text-lg">arrow_forward</span>
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-widest">
                            <span className="bg-[var(--off-white)] dark:bg-[var(--navy-deep)] px-4 text-slate-400 font-bold">Secure SSO</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex items-center justify-center space-x-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-navy-dark transition-all shadow-sm">
                            <img alt="Google" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBIMxmuaAuiAaYorcHvylEhYBmUKk2sk34s1dINBwWYLx2jmJ2NCq5wMAvXo_LcXS_hUv3BlUGJ6HdbXv4QhA4WX9ZgydDiiuJDcgJTG-2OfHTQVA-QHCb8HBMHsC9TxC8evFxem9vWgV1aP1ftN16OMoMeVH_wGa4SG6F558H0RM-XjjQ0yJ32-GqwVQL5WgEzWK4Mi2NupF4JCnH6mZ1jYe96ou8AyAINoLfoCeeE2xFM-Mz85SE1uo4CLUjaRwsnWl-tqSqNLe1L"/>
                            <span className="text-sm font-bold text-navy-deep dark:text-off-white">Google</span>
                        </button>
                        <button className="flex items-center justify-center space-x-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-navy-dark transition-all shadow-sm">
                            <svg className="w-5 h-5 text-[#0A66C2] fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path></svg>
                            <span className="text-sm font-bold text-navy-deep dark:text-off-white">LinkedIn</span>
                        </button>
                    </div>

                    <div className="mt-10 p-6 bg-slate-100 dark:bg-navy-dark/30 rounded-xl border border-slate-200 dark:border-slate-800">
                        <p className="text-center text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-tighter font-bold">
                            Professional environment detected. Data is encrypted using AES-256 standards. 
                            <br/>
                            By logging in, you agree to our 
                            <a href="#" className="text-primary underline">Client Agreement</a> &amp; 
                            <a href="#" className="text-primary underline">Security Policy</a>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
