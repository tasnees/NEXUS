import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    Brain, 
    Home, 
    Users, 
    Briefcase, 
    Video, 
    ClipboardCheck,
    BarChart3, 
    FileText, 
    Settings, 
    HelpCircle, 
    LogOut, 
    Calendar, 
    Search, 
    Bell,
    ExternalLink,
    RefreshCw
} from 'lucide-react';

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [headerDate, setHeaderDate] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);

    const DRIVE_LINK = "https://drive.google.com/drive/folders/1GP4bhdxIabQOs-dPsxS8f8Cc1rmZ__0a";

    useEffect(() => {
        setHeaderDate(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        navigate('/login');
    };

    const handleSyncDrive = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        setSyncMessage("Syncing...");
        try {
            const response = await fetch('http://localhost:8001/api/v1/sync/', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (response.ok) {
                setSyncMessage("Sync completed!");
                // Optionally trigger a custom event or state update to refresh pages
                window.dispatchEvent(new CustomEvent('drive-synced'));
            } else {
                setSyncMessage("Sync failed");
            }
        } catch (err) {
            setSyncMessage("Error");
        } finally {
            setIsSyncing(false);
            setTimeout(() => setSyncMessage(null), 3000);
        }
    };

    const isActive = (path: string) => location.pathname === path;
    const navClass = (path: string) => `nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${isActive(path) ? 'active' : ''}`;

    return (
        <div className="flex h-screen bg-base overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-[260px] bg-sidebar flex flex-col h-full 
                transition-transform duration-200 ease-out lg:relative lg:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="px-6 py-5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-semibold tracking-tight text-white">HireSync</h1>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">AI Platform</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                    <p className="px-3 py-2 text-[10px] uppercase tracking-widest text-slate-500 font-medium">Main</p>
                    <Link to="/dashboard" className={navClass('/dashboard')}>
                        <Home className="w-[18px] h-[18px]" /><span>Overview</span>
                    </Link>
                    <Link to="/candidates" className={navClass('/candidates')}>
                        <Users className="w-[18px] h-[18px]" /><span>Candidates</span>
                    </Link>
                    <Link to="/jobs" className={navClass('/jobs')}>
                        <Briefcase className="w-[18px] h-[18px]" /><span>Positions</span>
                    </Link>
                    <Link to="/interviews" className={navClass('/interviews')}>
                        <Video className="w-[18px] h-[18px]" /><span>Interviews</span>
                    </Link>
                    <Link to="/assessments" className={navClass('/assessments')}>
                        <ClipboardCheck className="w-[18px] h-[18px]" /><span>Assessments</span>
                    </Link>

                    <p className="px-3 py-2 mt-4 text-[10px] uppercase tracking-widest text-slate-500 font-medium">Insights</p>
                    <Link to="/sentiment-analysis" className={navClass('/sentiment-analysis')}>
                        <BarChart3 className="w-[18px] h-[18px]" /><span>Analytics</span>
                    </Link>
                    <Link to="/reports" className={navClass('/reports')}>
                        <FileText className="w-[18px] h-[18px]" /><span>Reports</span>
                    </Link>

                    <p className="px-3 py-2 mt-4 text-[10px] uppercase tracking-widest text-slate-500 font-medium">System</p>
                    <Link to="/settings" className={navClass('/settings')}>
                        <Settings className="w-[18px] h-[18px]" /><span>Settings</span>
                    </Link>
                    <Link to="/help" className={navClass('/help')}>
                        <HelpCircle className="w-[18px] h-[18px]" /><span>Help & Support</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/40 to-secondary/40 flex items-center justify-center text-sm font-semibold text-white">JD</div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">Jane Doe</p>
                            <p className="text-[11px] text-slate-400 truncate">HR Lead · Engineering</p>
                        </div>
                        <button onClick={handleLogout} className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-slate-300 transition-colors">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay */}
            {isSidebarOpen && (
                <div 
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] lg:hidden"
                ></div>
            )}

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="bg-white/80 backdrop-blur-xl border-b border-bdr sticky top-0 z-40">
                    <div className="flex items-center justify-between px-8 py-3.5">
                        <div className="flex items-center gap-4">
                            <div className="flex lg:hidden mr-2">
                                <button onClick={() => setIsSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-elevated text-txt-muted transition-colors">
                                    <Settings className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-txt-muted">
                                <Calendar className="w-4 h-4" />
                                <span>{headerDate}</span>
                            </div>
                            <div className="h-4 w-px bg-bdr hidden md:block"></div>
                            <a 
                                href={DRIVE_LINK} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-xs font-medium text-primary hover:text-primary-dark flex items-center gap-1 bg-primary/5 px-2 py-1 rounded-md transition-colors"
                            >
                                <ExternalLink className="w-3 h-3" /> View Source Drive
                            </a>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative hidden md:block">
                                <input 
                                    type="text" 
                                    placeholder="Search anything..." 
                                    className="w-64 bg-base border border-bdr rounded-lg px-4 py-2 pl-9 text-sm text-txt-primary placeholder:text-txt-faint outline-none focus:border-primary transition-all"
                                />
                                <Search className="w-4 h-4 text-txt-faint absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                            <button 
                                onClick={handleSyncDrive} 
                                disabled={isSyncing}
                                className="relative p-2 rounded-lg hover:bg-elevated text-txt-muted hover:text-primary transition-colors group"
                            >
                                <RefreshCw className={`w-[18px] h-[18px] ${isSyncing ? 'animate-spin' : ''}`} />
                                {syncMessage ? (
                                    <span className="absolute -bottom-8 right-0 bg-txt-primary text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">{syncMessage}</span>
                                ) : (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full pulse-dot"></span>
                                )}
                            </button>
                            <button className="p-2 rounded-lg hover:bg-elevated text-txt-muted hover:text-txt-secondary transition-colors">
                                <Bell className="w-[18px] h-[18px]" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
