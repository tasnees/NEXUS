import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const location = useLocation();
    
    const navItems = [
        { name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
        { name: 'Job Postings', icon: 'work', path: '/jobs' },
        { name: 'Candidates', icon: 'groups', path: '/candidates' },
        { name: 'Interviews', icon: 'event_available', path: '/interviews' },
        { name: 'Assessments', icon: 'quiz', path: '/assessments' },
        { name: 'Analytics', icon: 'monitoring', path: '/sentiment-analysis' },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex h-screen bg-[#f0f1f0] overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 bg-[#0D1B2A] text-slate-300 flex flex-col relative z-20 shadow-2xl overflow-y-auto custom-scrollbar">
                <div className="absolute inset-0 texture-overlay pointer-events-none opacity-10"></div>
                <div className="p-8 flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 bg-[#415a77] rounded-xl flex items-center justify-center shadow-lg shadow-[#415a77]/20">
                        <span className="material-symbols-outlined text-white">neurology</span>
                    </div>
                    <span className="text-2xl font-bold text-white tracking-tight">NEXUS<span className="text-[#415a77] ml-1 text-lg">AI</span></span>
                </div>
                
                <nav className="flex-1 px-6 mt-4 space-y-1 relative z-10">
                    <p className="px-4 py-2 text-[10px] font-bold text-[#778da9] uppercase tracking-[0.2em] mb-2 opacity-60">Management Console</p>
                    {navItems.map((item) => (
                        <Link 
                            key={item.path}
                            to={item.path} 
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                                isActive(item.path) 
                                    ? 'bg-[#415a77] text-white shadow-lg shadow-[#415a77]/30' 
                                    : 'hover:bg-white/5 text-slate-300 hover:text-white'
                            }`}
                        >
                            <span className={`material-symbols-outlined ${isActive(item.path) ? 'text-white' : 'text-[#778da9] group-hover:text-white'} transition-colors`}>
                                {item.icon}
                            </span>
                            <span className={`text-sm ${isActive(item.path) ? 'font-bold' : 'font-medium'}`}>{item.name}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-6 border-t border-white/5 relative z-10">
                    <div className="bg-gradient-to-br from-[#1B263B] to-[#0D1B2A] rounded-2xl p-4 mb-6 border border-white/10 shadow-inner">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] text-[#778da9] uppercase font-bold tracking-widest">Pipeline Health</p>
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                        </div>
                        <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mb-2">
                            <div className="bg-[#415a77] h-full w-[88%]"></div>
                        </div>
                        <p className="text-[10px] text-white font-bold tracking-tight">All systems operational</p>
                    </div>
                    
                    <div className="flex items-center gap-3 p-2 bg-white/5 rounded-2xl border border-white/5">
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                            <img 
                                alt="Recruiter" 
                                className="w-full h-full object-cover" 
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBizMENZ0vWMgFpYN3dpkBdzIhos1nNbvVVLYFreDVFyhG46Bg2PFF4fSjIcAHugFa4WSc1qVGix7erBy2AzOPM4cYviAKcEsR9hlt8qnkSYVUKNqkuhFDrV0t_mDjviMNsZn4Gbh62MkTeWe3ShpxIWX_AEq9rtjL6XbDM34i3k56-bhrsg3m4WpWU-v2BwwnE-r0PTvjk9sDHwC0QKIyR1itGAYfytn0H8cDuYKBj1YzcXyOU2XREt9nikHCTUWHIMKDv1pLUdaaT"
                            />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold text-white truncate">Marcus Chen</p>
                            <p className="text-[9px] text-[#778da9] font-bold uppercase tracking-wider">Lead Recruiter</p>
                        </div>
                        <button className="ml-auto text-[#778da9] hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-lg">logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto relative custom-scrollbar flex flex-col">
                {/* Global Header */}
                <header className="h-20 bg-white/50 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="relative group hidden sm:block">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl group-focus-within:text-[#415a77] transition-colors">search</span>
                            <input 
                                type="text" 
                                placeholder="Search candidates or jobs..." 
                                className="bg-slate-100/50 hover:bg-slate-100 border-none rounded-xl pl-11 pr-4 py-2.5 text-sm w-80 focus:ring-2 focus:ring-[#415a77]/20 focus:bg-white transition-all outline-none text-slate-800 placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition-colors relative">
                            <span className="material-symbols-outlined text-2xl">notifications</span>
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#415a77] rounded-full border-2 border-white"></span>
                        </button>
                        <div className="h-8 w-[1px] bg-slate-200"></div>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block leading-none">
                                <div className="text-xs font-black text-slate-800 tracking-tight">Sarah Jenkins</div>
                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">HR Admin</div>
                            </div>
                            <img 
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBN44XhRrUZ5Rhi4R-8BlXAD0iOXxn3iO7fzfVo9KJE_76Q7I8IqLCn1sc90ByAluXvbBL6cB4XQ33rho80EDOxGOXqMgOCZpNenacLC4A7xERvdoeIKXs-GajIgRSH1HunmJoJmZruSn2TQpdzi5B6xzgDdXOiiG5Tz3Qpjha1n7zf64BKXbaJ_11YGEMqgprZJ1GxOoBjD5cXnUerxdn5JDWvQxpbQMbHCmYtr4bL5X8zgcNsdVtZTOet9lpLTAmRCXtWsZkOFfdk" 
                                alt="User" 
                                className="w-10 h-10 rounded-xl border border-slate-200 shadow-sm object-cover"
                            />
                        </div>
                    </div>
                </header>

                <div className="flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
