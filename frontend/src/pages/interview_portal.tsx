import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Send, User, Bot, Loader2, CheckCircle2, Mic, MicOff, Video, VideoOff, MessageSquare, Monitor, Volume2, VolumeX } from 'lucide-react';

interface Message {
  role: 'agent' | 'candidate';
  content: string;
}

const InterviewPortal: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const interviewId = searchParams.get('interview_id');
    
    // UI State
    const [mode, setMode] = useState<'chat' | 'video'>('chat');
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'active' | 'completed'>('active');
    const [error, setError] = useState<string | null>(null);
    
    // Video/Voice State
    const [isMicOn, setIsMicOn] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    
    // Refs
    const scrollRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const recognitionRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // --- Initialization ---
    useEffect(() => {
        if (!interviewId) {
            setError("Missing Interview ID. Please use the link from your email.");
            return;
        }

        const initChat = async () => {
            try {
                const res = await fetch(`http://localhost:8001/api/v1/interview-agent/${interviewId}/init`);
                if (!res.ok) throw new Error("Failed to initialize interview session.");
                const data = await res.json();
                setMessages([{ role: 'agent', content: data.agent_message }]);
                setStatus(data.status);
                
                // Automatically speak the first message if in video mode
                if (mode === 'video') {
                    speak(data.agent_message);
                }
            } catch (err: any) {
                setError(err.message);
            }
        };

        initChat();
    }, [interviewId]);

    // --- Speech Recognition Setup ---
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                if (transcript) {
                    handleSendMessage(transcript);
                }
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech Recognition Error:", event.error);
                setIsListening(false);
            };
        }
    }, []);

    // --- Video Stream Setup ---
    useEffect(() => {
        if (isVideoOn && mode === 'video') {
            startVideo();
        } else {
            stopVideo();
        }
        return () => stopVideo();
    }, [isVideoOn, mode]);

    const startVideo = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: isMicOn });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera Access Error:", err);
            setIsVideoOn(false);
        }
    };

    const stopVideo = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const toggleMic = () => {
        if (!isMicOn && !isListening && !isSpeaking) {
            startListening();
        }
        setIsMicOn(!isMicOn);
    };

    const startListening = () => {
        if (recognitionRef.current && !isListening && !isSpeaking) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.error("Failed to start listening", e);
            }
        }
    };

    // --- Text to Speech ---
    const speak = (text: string) => {
        if (!('speechSynthesis' in window)) return;
        
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        // Try to find a better voice
        const voices = window.speechSynthesis.getVoices();
        const premiumVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha'));
        if (premiumVoice) utterance.voice = premiumVoice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            if (isMicOn) startListening();
        };

        window.speechSynthesis.speak(utterance);
    };

    // --- Message Handling ---
    const handleSendMessage = async (textOverride?: string) => {
        const text = textOverride || inputValue;
        if (!text.trim() || isLoading || status === 'completed') return;

        setInputValue('');
        setMessages(prev => [...prev, { role: 'candidate', content: text }]);
        setIsLoading(true);

        try {
            const res = await fetch(`http://localhost:8001/api/v1/interview-agent/${interviewId}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            if (!res.ok) throw new Error("Connection lost. Please try again.");
            
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'agent', content: data.agent_message }]);
            setStatus(data.status);
            
            if (mode === 'video') {
                speak(data.agent_message);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
                <div className="bg-slate-900 border border-red-500/30 p-8 rounded-3xl max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <span className="text-red-500 text-3xl">⚠️</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Access Error</h2>
                    <p className="text-slate-400 mb-8">{error}</p>
                    <button onClick={() => window.location.reload()} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all">Try Again</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col font-sans text-slate-200 overflow-hidden">
            {/* Minimal Header */}
            <header className="px-8 py-4 flex items-center justify-between z-10 border-b border-white/5 bg-black/40 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-bold text-white tracking-tight">Nexus AI <span className="text-slate-500 font-medium">| Interview Portal</span></span>
                </div>

                <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10">
                    <button 
                        onClick={() => setMode('chat')} 
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${mode === 'chat' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        <MessageSquare size={14} /> Chat
                    </button>
                    <button 
                        onClick={() => setMode('video')} 
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${mode === 'video' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Video size={14} /> Video
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{status}</span>
                    <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
                </div>
            </header>

            <main className="flex-1 flex flex-col relative overflow-hidden">
                {mode === 'chat' ? (
                    /* --- Chat Layout --- */
                    <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col p-8 overflow-hidden">
                        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'candidate' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                                    <div className={`flex gap-4 max-w-[85%] ${msg.role === 'candidate' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 ${msg.role === 'agent' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'}`}>
                                            {msg.role === 'agent' ? <Bot size={18} /> : <User size={18} />}
                                        </div>
                                        <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'agent' ? 'bg-slate-900 border border-white/5 text-slate-200' : 'bg-blue-600 text-white font-medium'}`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="flex gap-4 items-center bg-slate-900/50 px-5 py-3 rounded-2xl border border-white/5">
                                        <Loader2 size={16} className="text-blue-500 animate-spin" />
                                        <span className="text-xs text-slate-400 font-medium">Nexus is typing...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="mt-8 relative">
                            <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-2 flex items-center shadow-2xl">
                                <textarea
                                    rows={1}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                                    placeholder="Type your response..."
                                    className="flex-1 bg-transparent border-none outline-none px-6 py-4 text-sm"
                                />
                                <button onClick={() => handleSendMessage()} className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-500 transition-all"><Send size={20} /></button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* --- Video Call Layout --- */
                    <div className="flex-1 flex flex-col p-6">
                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                            {/* AI Agent View */}
                            <div className="aspect-video bg-slate-900 rounded-3xl border border-white/5 overflow-hidden relative group shadow-2xl">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent"></div>
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-8">
                                    <div className={`w-32 h-32 rounded-full bg-blue-600 flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.4)] transition-all duration-500 ${isSpeaking ? 'scale-110 shadow-[0_0_80px_rgba(37,99,235,0.6)]' : ''}`}>
                                        <Bot size={64} className="text-white" />
                                    </div>
                                    <div className="text-center">
                                        <h2 className="text-xl font-bold text-white mb-2">Nexus AI</h2>
                                        <p className="text-sm text-blue-400 font-medium tracking-widest uppercase">{isSpeaking ? 'Speaking...' : 'Listening'}</p>
                                    </div>
                                    {/* Waveform Visualization */}
                                    {isSpeaking && (
                                        <div className="flex gap-1 h-8 items-end">
                                            {[...Array(12)].map((_, i) => (
                                                <div key={i} className="w-1 bg-blue-500 rounded-full animate-wave" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}></div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-[10px] font-black uppercase text-white tracking-widest">Agent Live</span>
                                </div>
                            </div>

                            {/* Candidate View */}
                            <div className="aspect-video bg-slate-900 rounded-3xl border border-white/5 overflow-hidden relative shadow-2xl">
                                {!isVideoOn ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950">
                                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
                                            <User size={40} className="text-slate-600" />
                                        </div>
                                        <p className="text-sm text-slate-500 font-bold">Video is turned off</p>
                                    </div>
                                ) : (
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
                                )}
                                <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                                    <span className="text-[10px] font-black uppercase text-white tracking-widest">You (Candidate)</span>
                                </div>
                                {isListening && (
                                    <div className="absolute top-6 right-6 flex items-center gap-3 bg-blue-600/90 text-white px-4 py-2 rounded-full font-bold text-xs animate-in zoom-in">
                                        <Mic size={14} className="animate-pulse" /> Listening...
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Control Bar */}
                        <div className="mt-8 flex justify-center">
                            <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-4 flex items-center gap-6 shadow-2xl">
                                <button 
                                    onClick={toggleMic}
                                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMicOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white hover:bg-red-600'}`}
                                >
                                    {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
                                </button>
                                <button 
                                    onClick={() => setIsVideoOn(!isVideoOn)}
                                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isVideoOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white hover:bg-red-600'}`}
                                >
                                    {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
                                </button>
                                
                                <div className="h-8 w-[1px] bg-white/10"></div>

                                {isListening ? (
                                    <div className="px-6 py-2 bg-blue-600/20 border border-blue-500/30 rounded-2xl">
                                        <p className="text-xs font-bold text-blue-400">Speak now...</p>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={startListening}
                                        disabled={isSpeaking || isLoading}
                                        className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-500 transition-all disabled:opacity-50"
                                    >
                                        Push to Talk
                                    </button>
                                )}

                                <div className="h-8 w-[1px] bg-white/10"></div>

                                <button 
                                    onClick={() => setMode('chat')}
                                    className="w-14 h-14 rounded-full bg-white/5 text-slate-400 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all"
                                >
                                    <MessageSquare size={24} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Custom Animations */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes wave {
                    0%, 100% { height: 20%; }
                    50% { height: 100%; }
                }
                .animate-wave {
                    animation: wave 1s infinite ease-in-out;
                }
                .mirror {
                    transform: scaleX(-1);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
            `}} />
        </div>
    );
};

export default InterviewPortal;
