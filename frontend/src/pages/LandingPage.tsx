
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Menu, 
  X, 
  ArrowRight, 
  PlayCircle, 
  Users, 
  Clock, 
  Zap, 
  Building2, 
  Landmark, 
  HeartPulse, 
  GraduationCap, 
  Rocket, 
  Shield, 
  TrendingUp, 
  TrendingDown,
  Scale, 
  UserX, 
  DollarSign, 
  AlertTriangle, 
  ArrowDown, 
  ShieldCheck, 
  Target, 
  FileText, 
  ScanSearch, 
  BarChart3, 
  UserCheck, 
  Gauge, 
  LayoutDashboard, 
  Puzzle, 
  MessageCircle, 
  Timer, 
  Scaling, 
  Star, 
  Lock, 
  Key, 
  Server, 
  Sparkles,
  Globe,
  Send,
  Code
} from 'lucide-react';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const counterObserverRef = useRef<IntersectionObserver | null>(null);

    const toggleMobileMenu = () => setIsMenuOpen(!isMenuOpen);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);

        // Scroll Animations Observer
        observerRef.current = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        document.querySelectorAll('.animate-on-scroll').forEach(el => observerRef.current?.observe(el));

        // Counter Animation Observer
        counterObserverRef.current = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target as HTMLElement;
                    const target = parseInt(el.dataset.count || '0');
                    const suffix = el.textContent?.replace(/[0-9]/g, '') || '';
                    let current = 0;
                    const increment = Math.max(1, Math.floor(target / 40));
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            current = target;
                            clearInterval(timer);
                        }
                        el.textContent = current + suffix;
                    }, 30);
                    counterObserverRef.current?.unobserve(el);
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('[data-count]').forEach(el => counterObserverRef.current?.observe(el));

        return () => {
            window.removeEventListener('scroll', handleScroll);
            observerRef.current?.disconnect();
            counterObserverRef.current?.disconnect();
        };
    }, []);

    return (
        <div className="font-sans text-slate-900 bg-white overflow-x-hidden">
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
                @keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.4; } 100% { transform: scale(1.5); opacity: 0; } }
                @keyframes gridPulse { 0%,100% { opacity: 0.03; } 50% { opacity: 0.06; } }

                .animate-on-scroll { opacity: 0; transform: translateY(30px); transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1); }
                .animate-on-scroll.visible { opacity: 1; transform: translateY(0); }
                .animate-on-scroll.visible.delay-1 { transition-delay: 0.1s; }
                .animate-on-scroll.visible.delay-2 { transition-delay: 0.2s; }
                .animate-on-scroll.visible.delay-3 { transition-delay: 0.3s; }
                .animate-on-scroll.visible.delay-4 { transition-delay: 0.4s; }
                .animate-on-scroll.visible.delay-5 { transition-delay: 0.5s; }

                .float-anim { animation: float 6s ease-in-out infinite; }
                .float-anim-delay { animation: float 6s ease-in-out infinite; animation-delay: -3s; }

                .hero-grid {
                    background-image:
                        linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
                    background-size: 48px 48px;
                    animation: gridPulse 8s ease-in-out infinite;
                }

                .gradient-text { background: linear-gradient(135deg, #06c4ac 0%, #4770ff 50%, #7a9aff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

                .feature-card { transition: all 0.3s cubic-bezier(0.16,1,0.3,1); }
                .feature-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); }

                .stat-card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.06); }

                .flow-connector { position: relative; }
                .flow-connector::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    right: -32px;
                    width: 32px;
                    height: 2px;
                    background: linear-gradient(to right, #06c4ac, #4770ff);
                }
                .flow-connector::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    right: -38px;
                    width: 0;
                    height: 0;
                    border-left: 8px solid #4770ff;
                    border-top: 5px solid transparent;
                    border-bottom: 5px solid transparent;
                    transform: translateY(-50%);
                }

                .problem-card { position: relative; overflow: hidden; }
                .problem-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0;
                    width: 4px;
                    height: 100%;
                    background: #ef4444;
                    border-radius: 0 4px 4px 0;
                }
                .solution-card { position: relative; overflow: hidden; }
                .solution-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0;
                    width: 4px;
                    height: 100%;
                    background: linear-gradient(to bottom, #06c4ac, #4770ff);
                    border-radius: 0 4px 4px 0;
                }
            ` }} />

            {/* ===== NAVIGATION ===== */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <div onClick={() => navigate('/')} className="flex items-center gap-2.5 cursor-pointer">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20">
                                <Brain className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold text-slate-900 tracking-tight">HireSync<span className="text-[#06c4ac]">AI</span></span>
                        </div>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Features</a>
                            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">How It Works</a>
                            <a href="#benefits" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Benefits</a>
                            <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Testimonials</a>
                        </div>

                        {/* CTA */}
                        <div className="hidden md:flex items-center gap-3">
                            <button onClick={() => navigate('/login')} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-4 py-2">Sign In</button>
                            <button onClick={() => navigate('/signup')} className="text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 px-6 py-3 rounded-xl transition-all hover:shadow-xl hover:shadow-slate-900/20">Book a Demo</button>
                        </div>

                        {/* Mobile hamburger */}
                        <button className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600" onClick={toggleMobileMenu}>
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            <div className={`fixed inset-y-0 right-0 w-72 bg-white shadow-2xl z-[60] p-6 transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex justify-end mb-6">
                    <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" onClick={toggleMobileMenu}>
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex flex-col gap-4">
                    <a href="#features" className="text-base font-medium text-slate-700 hover:text-slate-900 py-2" onClick={toggleMobileMenu}>Features</a>
                    <a href="#how-it-works" className="text-base font-medium text-slate-700 hover:text-slate-900 py-2" onClick={toggleMobileMenu}>How It Works</a>
                    <a href="#benefits" className="text-base font-medium text-slate-700 hover:text-slate-900 py-2" onClick={toggleMobileMenu}>Benefits</a>
                    <a href="#testimonials" className="text-base font-medium text-slate-700 hover:text-slate-900 py-2" onClick={toggleMobileMenu}>Testimonials</a>
                    <hr className="border-slate-100 my-2" />
                    <button onClick={() => { toggleMobileMenu(); navigate('/login'); }} className="text-left text-base font-medium text-slate-700 py-2">Sign In</button>
                    <button onClick={() => { toggleMobileMenu(); navigate('/signup'); }} className="text-center text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 px-5 py-4 rounded-xl transition-all">Book a Demo</button>
                </div>
            </div>
            {isMenuOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55]" onClick={toggleMobileMenu}></div>}


            {/* ===== HERO SECTION ===== */}
            <section className="relative min-h-screen flex items-center bg-[#060b2e] overflow-hidden pt-20">
                <div className="hero-grid absolute inset-0 opacity-40"></div>
                {/* Decorative elements */}
                <div className="absolute top-20 right-[10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] float-anim"></div>
                <div className="absolute bottom-10 left-[5%] w-[400px] h-[400px] bg-[#06c4ac]/8 rounded-full blur-[100px] float-anim-delay"></div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-20 w-full">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left Content */}
                        <div style={{ animation: 'fadeUp 0.8s ease both' }}>
                            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8">
                                <span className="w-2 h-2 rounded-full bg-[#06c4ac] relative">
                                    <span className="absolute inset-0 rounded-full bg-[#06c4ac]" style={{ animation: 'pulse-ring 2s ease-out infinite' }}></span>
                                </span>
                                <span className="text-sm text-slate-300 font-medium tracking-wide">AI-Powered Recruitment Pipeline</span>
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-[4rem] font-black text-white leading-[1.05] tracking-tight mb-8">
                                Smarter Hiring<br />
                                <span className="gradient-text">Starts Here.</span>
                            </h1>

                            <p className="text-lg text-slate-400 leading-relaxed max-w-lg mb-10">
                                Screen, rank, and hire top talent 10× faster with AI that understands your requirements, reduces bias, and delivers actionable insights.
                            </p>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-12">
                                <button onClick={() => navigate('/signup')} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-bold px-8 py-4 rounded-xl hover:bg-slate-50 transition-all hover:shadow-2xl hover:shadow-white/10 text-sm">
                                    Request a Demo
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                                <a href="#how-it-works" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/15 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/5 transition-all text-sm">
                                    <PlayCircle className="w-4 h-4" />
                                    See How It Works
                                </a>
                            </div>

                            {/* Trust metrics */}
                            <div className="flex items-center gap-8">
                                <div>
                                    <p className="text-2xl font-black text-white">2,400+</p>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Hires Made</p>
                                </div>
                                <div className="w-px h-10 bg-white/10"></div>
                                <div>
                                    <p className="text-2xl font-black text-white">89%</p>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Time Saved</p>
                                </div>
                                <div className="w-px h-10 bg-white/10"></div>
                                <div>
                                    <p className="text-2xl font-black text-white">4.9★</p>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">User Rating</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Visual - Dashboard Mockup */}
                        <div className="hidden lg:block relative" style={{ animation: 'scaleIn 1s ease 0.2s both' }}>
                            <div className="relative">
                                {/* Main card */}
                                <div className="bg-white/[0.07] border border-white/[0.1] rounded-[2rem] p-8 backdrop-blur-xl shadow-2xl">
                                    {/* Mock header */}
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-400/60"></div>
                                            <div className="w-3 h-3 rounded-full bg-amber-400/60"></div>
                                            <div className="w-3 h-3 rounded-full bg-emerald-400/60"></div>
                                        </div>
                                        <span className="text-[11px] text-slate-500 font-black uppercase tracking-widest">HireSync Pipeline Node</span>
                                    </div>
                                    {/* Mock stats */}
                                    <div className="grid grid-cols-3 gap-4 mb-8">
                                        <div className="bg-white/[0.05] rounded-2xl p-5 border border-white/5">
                                            <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center mb-3"><Users className="w-4 h-4 text-blue-400" /></div>
                                            <p className="text-2xl font-black text-white">847</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase">Candidates</p>
                                        </div>
                                        <div className="bg-white/[0.05] rounded-2xl p-5 border border-white/5">
                                            <div className="w-9 h-9 rounded-xl bg-[#06c4ac]/20 flex items-center justify-center mb-3"><Brain className="w-4 h-4 text-[#06c4ac]" /></div>
                                            <p className="text-2xl font-black text-white">93%</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase">AI Match</p>
                                        </div>
                                        <div className="bg-white/[0.05] rounded-2xl p-5 border border-white/5">
                                            <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center mb-3"><Clock className="w-4 h-4 text-purple-400" /></div>
                                            <p className="text-2xl font-black text-white">4.2d</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase">Avg. Cycle</p>
                                        </div>
                                    </div>
                                    {/* Mock pipeline */}
                                    <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/5">
                                        <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest mb-4">Talent Distribution</p>
                                        <div className="space-y-4">
                                            <div><div className="flex justify-between text-[11px] mb-2 font-bold"><span className="text-slate-400 uppercase">Screened</span><span className="text-white">342</span></div><div className="h-2 bg-white/5 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" style={{ width: '85%' }}></div></div></div>
                                            <div><div className="flex justify-between text-[11px] mb-2 font-bold"><span className="text-slate-400 uppercase">Assessment</span><span className="text-white">128</span></div><div className="h-2 bg-white/5 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-gradient-to-r from-[#06c4ac] to-[#06c4ac]/60 rounded-full" style={{ width: '52%' }}></div></div></div>
                                            <div><div className="flex justify-between text-[11px] mb-2 font-bold"><span className="text-slate-400 uppercase">Final Stage</span><span className="text-white">46</span></div><div className="h-2 bg-white/5 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full" style={{ width: '24%' }}></div></div></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating card */}
                                <div className="absolute -bottom-8 -left-10 bg-white rounded-[2rem] shadow-2xl p-6 w-64 float-anim border border-slate-100">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm font-black text-white shadow-lg">SC</div>
                                        <div><p className="text-sm font-black text-slate-900">Sarah Chen</p><p className="text-[10px] text-slate-400 font-bold uppercase">Sr. Backend Engineer</p></div>
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full shadow-sm" style={{ width: '96%' }}></div></div>
                                        <span className="text-xs font-black text-emerald-600">96%</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">AI Heuristic Score</p>
                                </div>

                                {/* Floating badge */}
                                <div className="absolute -top-4 -right-4 bg-[#06c4ac] text-white text-[11px] font-black px-5 py-2.5 rounded-full shadow-2xl shadow-[#06c4ac]/40 float-anim-delay flex items-center gap-2 border border-white/20">
                                    <Zap className="w-4 h-4 fill-white" /> AI SYNCED
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
            </section>


            {/* ===== LOGOS SECTION ===== */}
            <section className="py-20 border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <p className="text-center text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-12">Trusted by hyper-growth organizations</p>
                    <div className="flex items-center justify-center gap-x-16 gap-y-10 flex-wrap opacity-40 grayscale">
                        <div className="flex items-center gap-3 text-slate-700 hover:opacity-100 transition-opacity"><Building2 className="w-8 h-8" /><span className="text-xl font-black uppercase tracking-tighter">TechCorp</span></div>
                        <div className="flex items-center gap-3 text-slate-700 hover:opacity-100 transition-opacity"><Landmark className="w-8 h-8" /><span className="text-xl font-black uppercase tracking-tighter">FinanceHub</span></div>
                        <div className="flex items-center gap-3 text-slate-700 hover:opacity-100 transition-opacity"><HeartPulse className="w-8 h-8" /><span className="text-xl font-black uppercase tracking-tighter">MedGroup</span></div>
                        <div className="flex items-center gap-3 text-slate-700 hover:opacity-100 transition-opacity"><GraduationCap className="w-8 h-8" /><span className="text-xl font-black uppercase tracking-tighter">EduPrime</span></div>
                        <div className="flex items-center gap-3 text-slate-700 hover:opacity-100 transition-opacity"><Rocket className="w-8 h-8" /><span className="text-xl font-black uppercase tracking-tighter">LaunchPad</span></div>
                        <div className="flex items-center gap-3 text-slate-700 hover:opacity-100 transition-opacity"><Shield className="w-8 h-8" /><span className="text-xl font-black uppercase tracking-tighter">SecureCo</span></div>
                    </div>
                </div>
            </section>


            {/* ===== PROBLEM → SOLUTION SECTION ===== */}
            <section className="py-24 lg:py-32 bg-white" id="problem-solution">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-20 animate-on-scroll">
                        <p className="text-sm font-black text-rose-500 uppercase tracking-[0.2em] mb-4">The Talent Bottleneck</p>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-6">Recruitment is Broken.</h2>
                        <p className="text-slate-500 mt-3 max-w-2xl mx-auto text-lg font-medium">HR teams spend 80% of their time on manual tasks that lead to biased decisions and missed top talent.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                        <div className="problem-card bg-rose-50/30 rounded-[2rem] p-10 animate-on-scroll delay-1 border border-rose-100/50">
                            <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mb-6">
                                <Clock className="w-7 h-7 text-rose-500" />
                            </div>
                            <h4 className="text-xl font-black text-slate-900 mb-3 tracking-tight">23 Hours Per Hire</h4>
                            <p className="text-slate-500 leading-relaxed font-medium">Manual screening of hundreds of resumes eats up an entire work week for every open position.</p>
                            <div className="mt-8 flex items-center gap-3 text-xs text-rose-500 font-black uppercase tracking-widest">
                                <TrendingUp className="w-4 h-4" /> Growing 15% YoY
                            </div>
                        </div>

                        <div className="problem-card bg-rose-50/30 rounded-[2rem] p-10 animate-on-scroll delay-2 border border-rose-100/50">
                            <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mb-6">
                                <Scale className="w-7 h-7 text-rose-500" />
                            </div>
                            <h4 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Unconscious Bias</h4>
                            <p className="text-slate-500 leading-relaxed font-medium">Resumes are often discarded for non-skill-related reasons before they are even fully read.</p>
                            <div className="mt-8 flex items-center gap-3 text-xs text-rose-500 font-black uppercase tracking-widest">
                                <AlertTriangle className="w-4 h-4" /> 79% of screenings affected
                            </div>
                        </div>

                        <div className="problem-card bg-rose-50/30 rounded-[2rem] p-10 animate-on-scroll delay-3 border border-rose-100/50">
                            <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mb-6">
                                <UserX className="w-7 h-7 text-rose-500" />
                            </div>
                            <h4 className="text-xl font-black text-slate-900 mb-3 tracking-tight">46% Bad Hires</h4>
                            <p className="text-slate-500 leading-relaxed font-medium">Nearly half of all new hires are later rated as mismatches, costing thousands in turnover.</p>
                            <div className="mt-8 flex items-center gap-3 text-xs text-rose-500 font-black uppercase tracking-widest">
                                <DollarSign className="w-4 h-4" /> $17K avg loss per hire
                            </div>
                        </div>
                    </div>

                    {/* Transition arrow */}
                    <div className="flex justify-center my-16 animate-on-scroll">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-px h-12 bg-gradient-to-b from-rose-200 to-[#06c4ac]/20"></div>
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#06c4ac] to-slate-900 flex items-center justify-center shadow-xl shadow-[#06c4ac]/30">
                                <ArrowDown className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Solution */}
                    <div className="text-center mb-16 animate-on-scroll">
                        <p className="text-sm font-black text-[#06c4ac] uppercase tracking-[0.2em] mb-4">The NexHire Solution</p>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">Autonomous Recruiting.</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="solution-card bg-[#06c4ac]/5 rounded-[2rem] p-10 animate-on-scroll delay-1 border border-[#06c4ac]/10">
                            <div className="w-14 h-14 rounded-2xl bg-[#06c4ac]/10 flex items-center justify-center mb-6">
                                <Zap className="w-7 h-7 text-[#06c4ac]" />
                            </div>
                            <h4 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Screen in Minutes</h4>
                            <p className="text-slate-500 leading-relaxed font-medium">AI processes 500+ resumes in under 2 minutes, surfacing only the most relevant candidates.</p>
                            <div className="mt-8 flex items-center gap-3 text-xs text-[#06c4ac] font-black uppercase tracking-widest">
                                <TrendingUp className="w-4 h-4" /> 92% time reduction
                            </div>
                        </div>

                        <div className="solution-card bg-[#06c4ac]/5 rounded-[2rem] p-10 animate-on-scroll delay-2 border border-[#06c4ac]/10">
                            <div className="w-14 h-14 rounded-2xl bg-[#06c4ac]/10 flex items-center justify-center mb-6">
                                <ShieldCheck className="w-7 h-7 text-[#06c4ac]" />
                            </div>
                            <h4 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Merit-Based Ranking</h4>
                            <p className="text-slate-500 leading-relaxed font-medium">Our algorithms focus purely on skills, experience, and qualifications to ensure objective hiring.</p>
                            <div className="mt-8 flex items-center gap-3 text-xs text-[#06c4ac] font-black uppercase tracking-widest">
                                <ShieldCheck className="w-4 h-4" /> SOC 2 Type II Compliant
                            </div>
                        </div>

                        <div className="solution-card bg-[#06c4ac]/5 rounded-[2rem] p-10 animate-on-scroll delay-3 border border-[#06c4ac]/10">
                            <div className="w-14 h-14 rounded-2xl bg-[#06c4ac]/10 flex items-center justify-center mb-6">
                                <Target className="w-7 h-7 text-[#06c4ac]" />
                            </div>
                            <h4 className="text-xl font-black text-slate-900 mb-3 tracking-tight">92% Retention Rate</h4>
                            <p className="text-slate-500 leading-relaxed font-medium">AI-matched candidates have significantly higher retention rates at 12 months vs industry average.</p>
                            <div className="mt-8 flex items-center gap-3 text-xs text-[#06c4ac] font-black uppercase tracking-widest">
                                <Target className="w-4 h-4" /> 3.8x Higher Retention
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* ===== HOW IT WORKS ===== */}
            <section className="py-24 lg:py-32 bg-slate-50" id="how-it-works">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-20 animate-on-scroll">
                        <p className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-4">Modern Workflow</p>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">Four Steps to Precision Hiring.</h2>
                        <p className="text-slate-500 mt-3 max-w-xl mx-auto text-lg font-medium">A seamless journey from JD to shortlist.</p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8 relative">
                        {/* Step 1 */}
                        <div className="relative animate-on-scroll delay-1">
                            <div className="flow-connector hidden lg:block"></div>
                            <div className="bg-white rounded-[2rem] border border-slate-200 p-10 h-full shadow-sm hover:shadow-xl transition-all duration-500">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-8 relative">
                                    <FileText className="w-7 h-7 text-slate-900" />
                                    <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-900 text-white text-[11px] font-black flex items-center justify-center shadow-lg">1</span>
                                </div>
                                <h4 className="text-lg font-black text-slate-900 mb-4 tracking-tight uppercase">Upload JD</h4>
                                <p className="text-sm text-slate-500 leading-relaxed font-medium">Paste your job description. Our AI extracts core requirements and skills instantly.</p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="relative animate-on-scroll delay-2">
                            <div className="flow-connector hidden lg:block"></div>
                            <div className="bg-white rounded-[2rem] border border-slate-200 p-10 h-full shadow-sm hover:shadow-xl transition-all duration-500">
                                <div className="w-14 h-14 rounded-2xl bg-[#06c4ac]/10 flex items-center justify-center mb-8 relative">
                                    <ScanSearch className="w-7 h-7 text-[#06c4ac]" />
                                    <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#06c4ac] text-white text-[11px] font-black flex items-center justify-center shadow-lg">2</span>
                                </div>
                                <h4 className="text-lg font-black text-slate-900 mb-4 tracking-tight uppercase">AI Screening</h4>
                                <p className="text-sm text-slate-500 leading-relaxed font-medium">Resumes are parsed, scored, and ranked against requirements in real-time.</p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="relative animate-on-scroll delay-3">
                            <div className="flow-connector hidden lg:block"></div>
                            <div className="bg-white rounded-[2rem] border border-slate-200 p-10 h-full shadow-sm hover:shadow-xl transition-all duration-500">
                                <div className="w-14 h-14 rounded-2xl bg-purple-100/50 flex items-center justify-center mb-8 relative">
                                    <BarChart3 className="w-7 h-7 text-purple-700" />
                                    <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-purple-600 text-white text-[11px] font-black flex items-center justify-center shadow-lg">3</span>
                                </div>
                                <h4 className="text-lg font-black text-slate-900 mb-4 tracking-tight uppercase">Smart Analysis</h4>
                                <p className="text-sm text-slate-500 leading-relaxed font-medium">Get detailed fit analysis per candidate with automated grading nodes.</p>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="relative animate-on-scroll delay-4">
                            <div className="bg-white rounded-[2rem] border border-slate-200 p-10 h-full shadow-sm hover:shadow-xl transition-all duration-500">
                                <div className="w-14 h-14 rounded-2xl bg-amber-100/50 flex items-center justify-center mb-8 relative">
                                    <UserCheck className="w-7 h-7 text-amber-700" />
                                    <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-amber-500 text-white text-[11px] font-black flex items-center justify-center shadow-lg">4</span>
                                </div>
                                <h4 className="text-lg font-black text-slate-900 mb-4 tracking-tight uppercase">Final Dispatch</h4>
                                <p className="text-sm text-slate-500 leading-relaxed font-medium">Shortlist is synced to your ATS or email for final interview coordination.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* ===== FEATURES ===== */}
            <section className="py-24 lg:py-32 bg-white" id="features">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-20 animate-on-scroll">
                        <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Core Technology</p>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">Engineered for Talent Ops.</h2>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="feature-card bg-slate-50 rounded-[2rem] p-10 animate-on-scroll delay-1 border border-slate-100">
                            <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center mb-6 shadow-xl">
                                <ScanSearch className="w-7 h-7 text-white" />
                            </div>
                            <h4 className="text-lg font-black text-slate-900 mb-3 tracking-tight uppercase">Automated CV Screening</h4>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">Instantly parse and evaluate resumes against custom criteria, eliminating manual review.</p>
                        </div>

                        <div className="feature-card bg-slate-50 rounded-[2rem] p-10 animate-on-scroll delay-2 border border-slate-100">
                            <div className="w-14 h-14 rounded-2xl bg-[#06c4ac] flex items-center justify-center mb-6 shadow-xl">
                                <Gauge className="w-7 h-7 text-white" />
                            </div>
                            <h4 className="text-lg font-black text-slate-900 mb-3 tracking-tight uppercase">Dynamic Match Scoring</h4>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">Multi-dimensional scoring across skills, experience, and growth potential metrics.</p>
                        </div>

                        <div className="feature-card bg-slate-50 rounded-[2rem] p-10 animate-on-scroll delay-3 border border-slate-100">
                            <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center mb-6 shadow-xl">
                                <ShieldCheck className="w-7 h-7 text-white" />
                            </div>
                            <h4 className="text-lg font-black text-slate-900 mb-3 tracking-tight uppercase">Bias Audit Engine</h4>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">Audited models that evaluate candidates purely on merit, ensuring fair outcomes.</p>
                        </div>

                        <div className="feature-card bg-slate-50 rounded-[2rem] p-10 animate-on-scroll delay-1 border border-slate-100">
                            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-6 shadow-xl">
                                <LayoutDashboard className="w-7 h-7 text-white" />
                            </div>
                            <h4 className="text-lg font-black text-slate-900 mb-3 tracking-tight uppercase">Talent Analytics</h4>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">Real-time pipeline analytics, time-to-hire metrics, and hiring funnel visualization.</p>
                        </div>

                        <div className="feature-card bg-slate-50 rounded-[2rem] p-10 animate-on-scroll delay-2 border border-slate-100">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center mb-6 shadow-xl">
                                <Puzzle className="w-7 h-7 text-white" />
                            </div>
                            <h4 className="text-lg font-black text-slate-900 mb-3 tracking-tight uppercase">Deep Integrations</h4>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">Seamlessly connects with Workday, Greenhouse, Lever, and 30+ other HR platforms.</p>
                        </div>

                        <div className="feature-card bg-slate-50 rounded-[2rem] p-10 animate-on-scroll delay-3 border border-slate-100">
                            <div className="w-14 h-14 rounded-2xl bg-rose-500 flex items-center justify-center mb-6 shadow-xl">
                                <MessageCircle className="w-7 h-7 text-white" />
                            </div>
                            <h4 className="text-lg font-black text-slate-900 mb-3 tracking-tight uppercase">Interview Intelligence</h4>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">Auto-generate role-specific questions with scoring rubrics for structured interviews.</p>
                        </div>
                    </div>
                </div>
            </section>


            {/* ===== BENEFITS (DATA-DRIVEN) ===== */}
            <section className="py-24 lg:py-32 bg-[#060b2e] relative overflow-hidden" id="benefits">
                <div className="absolute inset-0 hero-grid"></div>
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px]"></div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-20 animate-on-scroll">
                        <p className="text-sm font-black text-[#06c4ac] uppercase tracking-[0.3em] mb-4">Neural Impact</p>
                        <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight">Measurable Results for Teams.</h2>
                        <p className="text-slate-400 mt-3 max-w-xl mx-auto text-lg font-medium">Performance data from 400+ active pipelines.</p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="stat-card-hover bg-white/[0.04] border border-white/[0.08] rounded-[2.5rem] p-10 text-center animate-on-scroll delay-1 backdrop-blur-sm">
                            <div className="w-16 h-16 rounded-2xl bg-[#06c4ac]/10 flex items-center justify-center mx-auto mb-6">
                                <Timer className="w-8 h-8 text-[#06c4ac]" />
                            </div>
                            <p className="text-5xl font-black text-white mb-3" data-count="89">0%</p>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-loose">Faster Screening<br />Cycle-Time</p>
                        </div>

                        <div className="stat-card-hover bg-white/[0.04] border border-white/[0.08] rounded-[2.5rem] p-10 text-center animate-on-scroll delay-2 backdrop-blur-sm">
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-6">
                                <Target className="w-8 h-8 text-blue-400" />
                            </div>
                            <p className="text-5xl font-black text-white mb-3" data-count="92">0%</p>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-loose">Improvement in<br />Candidate Quality</p>
                        </div>

                        <div className="stat-card-hover bg-white/[0.04] border border-white/[0.08] rounded-[2.5rem] p-10 text-center animate-on-scroll delay-3 backdrop-blur-sm">
                            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-6">
                                <TrendingDown className="w-8 h-8 text-purple-400" />
                            </div>
                            <p className="text-5xl font-black text-white mb-3" data-count="67">0%</p>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-loose">Reduction in<br />Cost-Per-Hire</p>
                        </div>

                        <div className="stat-card-hover bg-white/[0.04] border border-white/[0.08] rounded-[2.5rem] p-10 text-center animate-on-scroll delay-4 backdrop-blur-sm">
                            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
                                <Users className="w-8 h-8 text-amber-400" />
                            </div>
                            <p className="text-5xl font-black text-white mb-3" data-count="10">0x</p>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-loose">Throughput in<br />Talent Ingestion</p>
                        </div>
                    </div>

                    {/* Sub-benefits */}
                    <div className="grid sm:grid-cols-2 gap-8 mt-12">
                        <div className="bg-white/[0.04] border border-white/[0.08] rounded-[2rem] p-8 flex items-start gap-6 animate-on-scroll delay-1 backdrop-blur-sm">
                            <div className="w-12 h-12 rounded-2xl bg-[#06c4ac]/10 flex items-center justify-center flex-shrink-0">
                                <Brain className="w-6 h-6 text-[#06c4ac]" />
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-white mb-2 tracking-tight uppercase">Data-Driven Logic</h4>
                                <p className="text-sm text-slate-400 leading-relaxed font-medium">Replace intuition with evidence-based recommendations backed by proprietary models.</p>
                            </div>
                        </div>

                        <div className="bg-white/[0.04] border border-white/[0.08] rounded-[2rem] p-8 flex items-start gap-6 animate-on-scroll delay-2 backdrop-blur-sm">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                <Scaling className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-white mb-2 tracking-tight uppercase">Hyper-Scalability</h4>
                                <p className="text-sm text-slate-400 leading-relaxed font-medium">Handle 10x candidate volume without adding overhead to your Talent Acquisition team.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* ===== TESTIMONIALS ===== */}
            <section className="py-24 lg:py-32 bg-white" id="testimonials">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-20 animate-on-scroll">
                        <p className="text-sm font-black text-slate-900 uppercase tracking-[0.3em] mb-4">Success Stories</p>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">Trusted by HR Leaders.</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-slate-50 rounded-[2.5rem] p-10 animate-on-scroll delay-1 border border-slate-100 hover:bg-white hover:shadow-2xl transition-all duration-500 group">
                            <div className="flex items-center gap-1 mb-8">
                                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                            </div>
                            <p className="text-lg text-slate-600 leading-relaxed mb-10 font-medium italic">"HireSync cut our screening time from 2 weeks to 4 hours. The quality of candidates reaching the interview stage has dramatically improved."</p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-sm font-black text-white shadow-lg group-hover:scale-110 transition-transform">RM</div>
                                <div><p className="text-sm font-black text-slate-900">Rachel Martinez</p><p className="text-xs text-slate-400 font-bold uppercase tracking-widest">VP of Talent, TechCorp</p></div>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-[2.5rem] p-10 animate-on-scroll delay-2 border border-slate-100 hover:bg-white hover:shadow-2xl transition-all duration-500 group">
                            <div className="flex items-center gap-1 mb-8">
                                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                            </div>
                            <p className="text-lg text-slate-600 leading-relaxed mb-10 font-medium italic">"The bias detection feature alone justified our investment. We've seen a measurable improvement in the diversity of our candidate pipelines."</p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#06c4ac] flex items-center justify-center text-sm font-black text-white shadow-lg group-hover:scale-110 transition-transform">DK</div>
                                <div><p className="text-sm font-black text-slate-900">David Kim</p><p className="text-xs text-slate-400 font-bold uppercase tracking-widest">CHRO, FinanceHub</p></div>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-[2.5rem] p-10 animate-on-scroll delay-3 border border-slate-100 hover:bg-white hover:shadow-2xl transition-all duration-500 group">
                            <div className="flex items-center gap-1 mb-8">
                                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                            </div>
                            <p className="text-lg text-slate-600 leading-relaxed mb-10 font-medium italic">"We scaled from hiring 50 to 500 engineers in a year. HireSync was the only way we could maintain quality at that volume."</p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-sm font-black text-white shadow-lg group-hover:scale-110 transition-transform">AP</div>
                                <div><p className="text-sm font-black text-slate-900">Aisha Patel</p><p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Head of TA, LaunchPad</p></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* ===== TRUST & SECURITY ===== */}
            <section className="py-20 bg-slate-50 border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="text-center md:text-left animate-on-scroll">
                            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase">Enterprise-Grade Security</h3>
                            <p className="text-slate-500 font-medium">Your data is encrypted, compliant, and always under your control.</p>
                        </div>
                        <div className="flex items-center gap-6 flex-wrap justify-center animate-on-scroll delay-1">
                            <div className="flex items-center gap-3 bg-white rounded-2xl px-6 py-4 border border-slate-200 shadow-sm">
                                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                                <span className="text-sm font-black text-slate-700 uppercase tracking-widest">SOC 2 Type II</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white rounded-2xl px-6 py-4 border border-slate-200 shadow-sm">
                                <Lock className="w-6 h-6 text-slate-900" />
                                <span className="text-sm font-black text-slate-700 uppercase tracking-widest">GDPR Ready</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white rounded-2xl px-6 py-4 border border-slate-200 shadow-sm">
                                <Key className="w-6 h-6 text-amber-600" />
                                <span className="text-sm font-black text-slate-700 uppercase tracking-widest">AES-256</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white rounded-2xl px-6 py-4 border border-slate-200 shadow-sm">
                                <Server className="w-6 h-6 text-slate-600" />
                                <span className="text-sm font-black text-slate-700 uppercase tracking-widest">99.9% Uptime</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* ===== CTA SECTION ===== */}
            <section className="py-24 lg:py-32 bg-white" id="cta">
                <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center animate-on-scroll">
                    <div className="bg-gradient-to-br from-[#060b2e] via-slate-900 to-black rounded-[3rem] p-12 lg:p-24 relative overflow-hidden shadow-2xl">
                        <div className="hero-grid absolute inset-0 opacity-20"></div>
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#06c4ac]/10 rounded-full blur-[120px]"></div>
                        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px]"></div>

                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-6 py-2 mb-10 backdrop-blur-md">
                                <Sparkles className="w-5 h-5 text-[#06c4ac]" />
                                <span className="text-sm text-slate-200 font-black uppercase tracking-widest">Free 14-day trial — Setup in 5m</span>
                            </div>

                            <h2 className="text-4xl lg:text-6xl font-black text-white tracking-tight mb-8 leading-[1.1]">Start Hiring Smarter Today.</h2>
                            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 font-medium">Join 400+ organizations that have transformed their recruitment with HireSync AI. Precision at scale.</p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                <button onClick={() => navigate('/signup')} className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white text-slate-900 font-black px-10 py-5 rounded-2xl hover:bg-slate-50 transition-all hover:shadow-2xl hover:shadow-white/20 text-sm uppercase tracking-widest">
                                    Book a Demo
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                                <button onClick={() => navigate('/signup')} className="w-full sm:w-auto inline-flex items-center justify-center gap-3 border border-white/20 text-white font-black px-10 py-5 rounded-2xl hover:bg-white/10 transition-all text-sm uppercase tracking-widest backdrop-blur-sm">
                                    Get Started Free
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* ===== FOOTER ===== */}
            <footer className="bg-[#060b2e] border-t border-white/5 pt-20 pb-10">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-16 mb-20">
                        {/* Brand */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-xl border border-white/10">
                                    <Brain className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-2xl font-black text-white tracking-tight">HireSync<span className="text-[#06c4ac]">AI</span></span>
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed max-w-xs mb-10 font-medium">Building the future of recruitment automation through intelligent, data-driven workflows. precision hiring for global teams.</p>
                            <div className="flex items-center gap-4">
                                <a href="#" className="w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/5"><Globe className="w-5 h-5" /></a>
                                <a href="#" className="w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/5"><Send className="w-5 h-5" /></a>
                                <a href="#" className="w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/5"><Code className="w-5 h-5" /></a>
                            </div>
                        </div>

                        {/* Links */}
                        <div>
                            <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em] mb-8">Product</p>
                            <div className="space-y-4">
                                <a href="#features" className="block text-sm text-slate-500 hover:text-[#06c4ac] transition-colors font-medium">AI Screening</a>
                                <a href="#" className="block text-sm text-slate-500 hover:text-[#06c4ac] transition-colors font-medium">Pricing</a>
                                <a href="#" className="block text-sm text-slate-500 hover:text-[#06c4ac] transition-colors font-medium">Integrations</a>
                                <a href="#" className="block text-sm text-slate-500 hover:text-[#06c4ac] transition-colors font-medium">Changelog</a>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em] mb-8">Company</p>
                            <div className="space-y-4">
                                <a href="#" className="block text-sm text-slate-500 hover:text-[#06c4ac] transition-colors font-medium">About</a>
                                <a href="#" className="block text-sm text-slate-500 hover:text-[#06c4ac] transition-colors font-medium">Blog</a>
                                <a href="#" className="block text-sm text-slate-500 hover:text-[#06c4ac] transition-colors font-medium">Careers</a>
                                <a href="#" className="block text-sm text-slate-500 hover:text-[#06c4ac] transition-colors font-medium">Contact</a>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em] mb-8">Legal</p>
                            <div className="space-y-4">
                                <a href="#" className="block text-sm text-slate-500 hover:text-[#06c4ac] transition-colors font-medium">Privacy Policy</a>
                                <a href="#" className="block text-sm text-slate-500 hover:text-[#06c4ac] transition-colors font-medium">Terms of Service</a>
                                <a href="#" className="block text-sm text-slate-500 hover:text-[#06c4ac] transition-colors font-medium">Security</a>
                                <a href="#" className="block text-sm text-slate-500 hover:text-[#06c4ac] transition-colors font-medium">GDPR</a>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-white/5 pt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">&copy; 2026 HireSync AI. All rights reserved.</p>
                        <p className="text-xs text-slate-600 font-bold uppercase tracking-widest flex items-center gap-2">Built with <HeartPulse className="w-4 h-4 text-[#06c4ac]" /> for modern recruitment</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
