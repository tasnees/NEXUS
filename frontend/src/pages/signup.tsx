import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Signup: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        company_name: '',
        role: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load external Material Fonts
    useEffect(() => {
        const materialIconsId = 'material-icons-font';
        if (!document.getElementById(materialIconsId)) {
            const link = document.createElement('link');
            link.id = materialIconsId;
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
            document.head.appendChild(link);
        }

        const materialSymbolsId = 'material-symbols-font';
        if (!document.getElementById(materialSymbolsId)) {
            const link = document.createElement('link');
            link.id = materialSymbolsId;
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
            document.head.appendChild(link);
        }
    }, []);

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
            const response = await fetch('http://localhost:8000/api/v1/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Signup failed');
            }

            console.log('Signup success:', data);
            // Redirect to jobs or login
            navigate('/jobs');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred during signup');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="font-sans bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-200 antialiased h-screen overflow-hidden">
            <div className="flex h-full w-full">
                {/* Left Side: Hero Image & Branding */}
                <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-overlay-dark/90 to-primary/60 z-10"></div>
                    <img 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGJUWBMHukbDIZlX337O0mPm0eXrpIbNfCdXKWVb7WPksX6FfGTfdrgwg_VE-e7z98L8Umot1-S-pYqn6BXObCNSx60vE0N-uM-4KFFUJZr-m9iS2iVJTwnU-N0X2_cQvyHEkN-BdNErKfLVNDvDj5pxkOn5BFbKsIySjiRjYoUCZ6Y--33rkBppb97hPQu6MFDcm1SHyRTPe2bqPrw5cM_5gEyhq3FBNU-lo7-ec-0egJ7QrOkkU4p2V0_9p4C_90tUxJ9WrinNs2" 
                        alt="Professional team collaborating in modern office" 
                        className="absolute inset-0 w-full h-full object-cover" 
                    />
                    <div className="relative z-20 flex flex-col justify-between h-full p-12 text-white">
                        <div>
                            <div className="flex items-center gap-2 mb-8">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center">
                                    <span className="material-icons text-white">auto_awesome</span>
                                </div>
                                <span className="text-2xl font-bold tracking-tight">HireAI</span>
                            </div>
                        </div>
                        <div className="max-w-md">
                            <h1 className="text-5xl font-bold leading-tight mb-6">
                                Hire smarter, <br/><span className="text-white/80">not harder.</span>
                            </h1>
                            <p className="text-lg text-slate-200/90 leading-relaxed mb-8">
                                Join thousands of recruiters using AI to automate job postings and streamline candidate pipelines in minutes.
                            </p>
                            <div className="space-y-4">
                                {[
                                    'Automated Resume Screening',
                                    'AI-Powered Job Descriptions',
                                    'Real-time Pipeline Analytics'
                                ].map((item, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <div className="w-6 h-6 rounded-full bg-primary/40 flex items-center justify-center">
                                            <span className="material-icons text-sm text-white">check</span>
                                        </div>
                                        <span className="text-sm">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="text-sm text-slate-300">
                            © 2024 HireAI Platforms Inc. All rights reserved.
                        </div>
                    </div>
                </div>

                {/* Right Side: Sign-up Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
                    <div className="w-full max-w-md">
                        <div className="mb-10 lg:hidden flex justify-center">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                                    <span className="material-icons text-white">auto_awesome</span>
                                </div>
                                <span className="text-2xl font-bold tracking-tight text-primary">HireAI</span>
                            </div>
                        </div>
                        
                        <div className="mb-10 text-center lg:text-left">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Recruiter Sign Up</h2>
                            <p className="text-slate-500 dark:text-slate-400">Get started with your 14-day free trial.</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 text-sm animate-pulse">
                                <span className="material-icons">error_outline</span>
                                <p className="font-semibold">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 gap-5">
                                {/* Full Name */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="full_name">Full Name</label>
                                    <input 
                                        className="w-full px-4 py-3 bg-white dark:bg-background-dark border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all duration-200 text-slate-900 dark:text-white" 
                                        id="full_name" 
                                        name="full_name" 
                                        placeholder="Enter your full name" 
                                        required 
                                        type="text"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* Work Email */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="email">Work Email</label>
                                    <input 
                                        className="w-full px-4 py-3 bg-white dark:bg-background-dark border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all duration-200 text-slate-900 dark:text-white" 
                                        id="email" 
                                        name="email" 
                                        placeholder="name@company.com" 
                                        required 
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Company Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="company_name">Company Name</label>
                                        <input 
                                            className="w-full px-4 py-3 bg-white dark:bg-background-dark border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all duration-200 text-slate-900 dark:text-white" 
                                            id="company_name" 
                                            name="company_name" 
                                            placeholder="Acme Corp" 
                                            required 
                                            type="text"
                                            value={formData.company_name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    {/* Role Dropdown */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="role">Role</label>
                                        <select 
                                            className="w-full px-4 py-3 bg-white dark:bg-background-dark border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all duration-200 appearance-none text-slate-900 dark:text-white" 
                                            id="role" 
                                            name="role" 
                                            required
                                            value={formData.role}
                                            onChange={handleChange}
                                        >
                                            <option disabled value="">Select role</option>
                                            <option value="ta">Talent Acquisition</option>
                                            <option value="hm">HR Manager</option>
                                            <option value="rl">Recruiting Lead</option>
                                            <option value="hp">Head of People</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="password">Password</label>
                                    <input 
                                        className="w-full px-4 py-3 bg-white dark:bg-background-dark border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all duration-200 text-slate-900 dark:text-white" 
                                        id="password" 
                                        name="password" 
                                        placeholder="Min. 8 characters" 
                                        required 
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    <p className="mt-1.5 text-xs text-slate-400">Must include a symbol and a number.</p>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button 
                                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3.5 px-6 rounded-lg shadow-lg shadow-primary/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed" 
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : (
                                        <>
                                            <span>Create Account</span>
                                            <span className="material-icons text-lg">arrow_forward</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="flex items-center gap-4 my-6">
                                <div className="flex-grow h-px bg-slate-200 dark:bg-slate-700"></div>
                                <span className="text-xs text-slate-400 uppercase tracking-widest">or</span>
                                <div className="flex-grow h-px bg-slate-200 dark:bg-slate-700"></div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" type="button">
                                    <img 
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCT_KcKya74X3kbZdlGf5PfJewPGipo6MzcjblG4WN3lIUalR2QqyeYEMWGuGWnAzxC7eUNU90huGafHFXOBaEq47GEtqk78dLWP51m95P__sToUJk5uvYu1ZZXpJYpbtrvSAWy_mCZQrjZq1xXyv-hEKqt7LidTd53U8kVo3rlAh0d2tMngd5pytg0n81B8UHf5NuyVCUal_RcuFbRuVAyuCtKV9ySTFbg9nVjkzHgiwga9TZgnu0JM-vp5PQFa_-dRArInWiLdod7" 
                                        alt="Google icon" 
                                        className="w-4 h-4" 
                                    />
                                    <span className="text-sm font-medium dark:text-white">Google</span>
                                </button>
                                <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" type="button">
                                    <span className="material-icons text-blue-600 text-lg">business</span>
                                    <span className="text-sm font-medium dark:text-white">SSO</span>
                                </button>
                            </div>

                            <div className="text-center mt-8">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Already have an account? 
                                    <Link className="text-primary font-bold hover:underline ml-1" to="/login">Log in</Link>
                                </p>
                            </div>

                            <div className="mt-8 text-[10px] text-center text-slate-400 leading-normal">
                                By signing up, you agree to our 
                                <a className="underline mx-1" href="#">Terms of Service</a> and 
                                <a className="underline ml-1" href="#">Privacy Policy</a>.
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
