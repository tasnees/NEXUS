import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
            {/* TopAppBar Navigation */}
            <header className="fixed top-0 w-full z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-md shadow-sm">
                <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-2xl">hub</span>
                        <span className="text-xl font-bold tracking-tight text-primary">HireSync AI</span>
                    </div>
                    <button 
                        onClick={() => navigate('/login')}
                        className="bg-primary-container text-white px-4 py-2 rounded-lg font-button text-button hover:bg-primary transition-colors active:scale-95"
                    >
                        Get Started
                    </button>
                </nav>
            </header>

            <main className="pt-20">
                {/* Hero Section */}
                <section className="px-6 py-xxl flex flex-col items-center text-center max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-fixed text-on-secondary-fixed-variant rounded-full text-label-md font-label-md mb-md">
                        <span className="material-symbols-outlined text-[16px] fill-1">auto_awesome</span>
                        AI-Driven Recruitment
                    </div>
                    <h1 className="font-h1 text-h1 text-on-background mb-md leading-tight">
                        Automate Your Hiring, Effortlessly
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant mb-xl max-w-2xl">
                        Streamline your recruitment lifecycle with AI-driven workflows. Let HireSync AI handle the heavy lifting while you focus on finding the perfect fit.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <button 
                            onClick={() => navigate('/login')}
                            className="bg-primary text-on-primary px-xl py-md rounded-lg font-button text-button hover:bg-primary-container transition-all active:scale-95 shadow-lg"
                        >
                            Start Free Trial
                        </button>
                        <button className="border border-secondary text-secondary px-xl py-md rounded-lg font-button text-button hover:bg-secondary-fixed transition-all active:scale-95">
                            Book a Demo
                        </button>
                    </div>

                    {/* Hero Dashboard Mockup */}
                    <div className="mt-xxl w-full relative">
                        <div className="bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-xl p-md shadow-xl overflow-hidden">
                            <img 
                                alt="Dashboard Preview" 
                                className="w-full h-auto rounded-lg" 
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_-Pd0AegWBt3ok-UQEdqjEehWscEpBOUoAs7Wli_qRWQ4tPYEA72dDK9TktBtxMZH5VYWsf7RlhTk_vaqQ68J9n8Ba5wgiKtjVZ5JkWVZKBW2AHG8kub_8WibvLFmbPcY0MKm4e7YZDKoPpBL3R0Yjk-omcN36c_geqZnWN9o-6yo3cZxzSri--eM6caR7sPHp18I2532tbOXG5o4Opn9yb50PKKIoz_8arOMTvNKQ1WAoFYtPmGCv34s4A6j8KqXgZ4Dalwinw" 
                            />
                        </div>
                        {/* Floating Decorative Element */}
                        <div className="absolute -bottom-6 -right-6 hidden md:block">
                            <div className="bg-white/70 backdrop-blur-md p-4 rounded-xl shadow-lg border border-primary-fixed">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-secondary-container text-white flex items-center justify-center">
                                        <span className="material-symbols-outlined fill-1">check_circle</span>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-label-md font-label-md text-on-surface-variant">Candidate Matched</p>
                                        <p className="text-body-sm font-bold text-on-surface">Alex Rivera - 98% Match</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Social Proof */}
                <section className="bg-surface-container-low py-xl overflow-hidden">
                    <p className="text-center text-label-md font-label-md text-outline uppercase tracking-widest mb-lg">Trusted by leading HR teams</p>
                    <div className="flex justify-center gap-xl md:gap-xxl px-6 opacity-60 grayscale filter">
                        <span className="font-h3 text-h3 text-slate-400">GLOBALX</span>
                        <span className="font-h3 text-h3 text-slate-400">TECHFLOW</span>
                        <span className="font-h3 text-h3 text-slate-400">HORIZON</span>
                        <span className="font-h3 text-h3 text-slate-400">STRATOS</span>
                    </div>
                </section>

                {/* Features Section */}
                <section className="px-6 py-xxl max-w-7xl mx-auto">
                    <div className="text-center mb-xxl">
                        <h2 className="font-h2 text-h2 text-on-background mb-sm">Empower Your Talent Strategy</h2>
                        <p className="font-body-md text-body-md text-on-surface-variant">Designed for speed, built for reliability.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                        {/* Feature 1 */}
                        <div className="bg-white p-xl rounded-xl border border-outline-variant hover:shadow-lg transition-shadow group">
                            <div className="w-12 h-12 bg-primary-fixed text-primary rounded-lg flex items-center justify-center mb-lg group-hover:bg-primary group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined">psychology</span>
                            </div>
                            <h3 className="font-h3 text-h3 mb-md">AI-Powered Screening</h3>
                            <p className="font-body-md text-body-md text-on-surface-variant">
                                Our intelligent algorithms automatically rank candidates based on skill compatibility and cultural fit metrics.
                            </p>
                        </div>
                        {/* Feature 2 */}
                        <div className="bg-white p-xl rounded-xl border border-outline-variant hover:shadow-lg transition-shadow group">
                            <div className="w-12 h-12 bg-secondary-fixed text-secondary rounded-lg flex items-center justify-center mb-lg group-hover:bg-secondary group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined">calendar_today</span>
                            </div>
                            <h3 className="font-h3 text-h3 mb-md">Automated Scheduling</h3>
                            <p className="font-body-md text-body-md text-on-surface-variant">
                                Sync seamlessly with your team's calendars to eliminate back-and-forth emails and accelerate the interview process.
                            </p>
                        </div>
                        {/* Feature 3 */}
                        <div className="bg-white p-xl rounded-xl border border-outline-variant hover:shadow-lg transition-shadow group">
                            <div className="w-12 h-12 bg-tertiary-fixed text-tertiary rounded-lg flex items-center justify-center mb-lg group-hover:bg-tertiary group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined">database</span>
                            </div>
                            <h3 className="font-h3 text-h3 mb-md">Centralized Tracking</h3>
                            <p className="font-body-md text-body-md text-on-surface-variant">
                                Maintain a single source of truth for all candidate interactions and hiring progress across your entire organization.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Process Section */}
                <section className="bg-white py-xxl px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-left mb-xxl max-w-2xl">
                            <h2 className="font-h2 text-h2 text-on-background mb-md">Your Path to Better Hires</h2>
                            <p className="font-body-md text-body-md text-on-surface-variant">We've simplified the hiring journey into three high-impact stages.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                            {/* Connector Line (Desktop) */}
                            <div className="hidden md:block absolute top-1/4 left-0 w-full h-[2px] bg-surface-container-highest -z-0"></div>
                            {/* Step 1 */}
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold mb-md text-lg shadow-md">1</div>
                                <h4 className="font-h3 text-[20px] mb-sm">Post Job</h4>
                                <p className="font-body-sm text-body-sm text-on-surface-variant">Draft your role and distribute it across hundreds of premium job boards with a single click.</p>
                                <div className="mt-lg rounded-lg overflow-hidden border border-outline-variant shadow-sm">
                                    <img 
                                        alt="Post Job Step" 
                                        className="w-full h-40 object-cover" 
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBae-uHcTteshIbi1PyxHFlESfIL1AJvMMUKTLgvSJ0FMicMKDOr3j2vgRuhTNTLQkCM-vxhWDKZohXsg-pmYqESHYRNQfZSKCyq8uHLtr3niMwgW6Q2vt6T6IWxweuqTqB8tGyJGUwipt9JGCMm46Qk7puXtXamfTVU5E1dNkHDvgXSbRaP6Jsi2ecMJaM_p_-TfvNX7tenkAMnsbnSUirfPiAN9yNqgseuVBOvn3DZ0-rRU1rFGYhJ4E9KfPBLxyRxOQIsUJ_dw" 
                                    />
                                </div>
                            </div>
                            {/* Step 2 */}
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-full bg-secondary text-white flex items-center justify-center font-bold mb-md text-lg shadow-md">2</div>
                                <h4 className="font-h3 text-[20px] mb-sm">Automate Screening</h4>
                                <p className="font-body-sm text-body-sm text-on-surface-variant">AI analyzes resumes and initial responses to highlight top-tier talent instantly for your review.</p>
                                <div className="mt-lg rounded-lg overflow-hidden border border-outline-variant shadow-sm">
                                    <img 
                                        alt="Automate Step" 
                                        className="w-full h-40 object-cover" 
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4yBJu310VWkVSryVbv6eD6WXYk721gG6vI-kzll9h9MrZlh3G28QdDDXoJpbSIvMSiL40SLHD_o0iyjTMXLNtt6aSr0Y-h2pLYVVl3--hnZ8h4kM4kjDRd5LuzXWGfAUkkw9BvrPAeeKYRMTZJYgiQa-CCxpat7T5L2HJvy20jL-5QNH5Gg5F5ZdOxBm9xgRePIY42l8Z-3csXIrkNd15ugN40fsS6Kkbjsbh-Zoz76_nkdlV4w3h7ZpWNKOJgDH9J1orYToprQ" 
                                    />
                                </div>
                            </div>
                            {/* Step 3 */}
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-full bg-tertiary-container text-white flex items-center justify-center font-bold mb-md text-lg shadow-md">3</div>
                                <h4 className="font-h3 text-[20px] mb-sm">Hire the Best</h4>
                                <p className="font-body-sm text-body-sm text-on-surface-variant">Collaborate with your team to make data-driven decisions and extend offers with automated onboarding.</p>
                                <div className="mt-lg rounded-lg overflow-hidden border border-outline-variant shadow-sm">
                                    <img 
                                        alt="Hire Step" 
                                        className="w-full h-40 object-cover" 
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5OOkELl6TUUNHe5NF7BzpYKDLqhoxTfswV-nJKwHrLKeWeZBN9H_UirQjSv71T-DuqyhH39iNjftbaep9HbxG_UMhunNmv5BYsJnvp3gr5W4JaCGKHAQ51MkiEXv80Tt9AJNahF2X_deVsXekFeLcLY8xLFJir5910woxZoKZIe81m5FWy0NA_P2-KnpcgQdYpYqY3KhwJDUFh734n2WGijCENnXlgUSeRK4-wQFtA_K__AdwQlcbiMTs4r5GvNBKNXJM4-GscQ" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA Section */}
                <section className="px-6 py-xxl text-center">
                    <div className="bg-primary-container rounded-3xl p-xl md:p-xxl max-w-5xl mx-auto shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary rounded-full filter blur-[100px] opacity-30 -mr-32 -mt-32"></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <h2 className="font-h2 text-h2 text-white mb-md">Transform your recruitment process today.</h2>
                            <p className="font-body-lg text-body-lg text-primary-fixed mb-xl max-w-xl">
                                Join thousands of companies using HireSync AI to scale their teams faster and smarter.
                            </p>
                            <button 
                                onClick={() => navigate('/login')}
                                className="bg-white text-primary px-xxl py-md rounded-lg font-button text-button hover:bg-surface-container transition-all active:scale-95 shadow-lg"
                            >
                                Start Free Trial
                            </button>
                            <p className="mt-md text-label-md font-label-md text-primary-fixed-dim">No credit card required. 14-day free trial.</p>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="w-full border-t border-slate-200 bg-slate-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-8 py-12 max-w-7xl mx-auto w-full">
                    <div className="col-span-1">
                        <div className="text-lg font-black text-primary mb-md">HireSync AI</div>
                        <p className="text-sm text-slate-500 max-w-xs">Building the future of recruitment automation through intelligent, data-driven workflows.</p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <p className="font-bold text-on-surface text-label-md">Product</p>
                        <a className="text-sm text-slate-500 hover:text-secondary transition-colors" href="#">AI Screening</a>
                        <a className="text-sm text-slate-500 hover:text-secondary transition-colors" href="#">Automated Scheduling</a>
                        <a className="text-sm text-slate-500 hover:text-secondary transition-colors" href="#">Pricing</a>
                    </div>
                    <div className="flex flex-col gap-3">
                        <p className="font-bold text-on-surface text-label-md">Solutions</p>
                        <a className="text-sm text-slate-500 hover:text-secondary transition-colors" href="#">For Enterprise</a>
                        <a className="text-sm text-slate-500 hover:text-secondary transition-colors" href="#">For Startups</a>
                        <a className="text-sm text-slate-500 hover:text-secondary transition-colors" href="#">Integrations</a>
                    </div>
                    <div className="flex flex-col gap-3">
                        <p className="font-bold text-on-surface text-label-md">Company</p>
                        <a className="text-sm text-slate-500 hover:text-secondary transition-colors" href="#">Privacy Policy</a>
                        <a className="text-sm text-slate-500 hover:text-secondary transition-colors" href="#">Terms of Service</a>
                        <a className="text-sm text-slate-500 hover:text-secondary transition-colors" href="#">Contact Us</a>
                    </div>
                </div>
                <div className="border-t border-slate-200 py-6 px-8 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-slate-500">© 2024 HireSync AI. All rights reserved.</p>
                    <div className="flex gap-6">
                        <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-primary transition-colors">share</span>
                        <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-primary transition-colors">language</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
