import { useState, useEffect, useRef } from 'react';

const API = 'http://localhost:8001';

interface Candidate {
  id: number;
  name: string;
  email: string;
  applied_job: string;
  skills: string[];
  summary: string;
}

interface LogEntry {
  time: string;
  level: 'info' | 'success' | 'error' | 'ai';
  message: string;
}

interface PreviewData {
  candidate_name: string;
  candidate_email: string;
  role: string;
  subject: string;
  plain_body: string;
  html_preview: string;
}

export default function AIRecruiter() {
  const [candidates, setCandidates]     = useState<Candidate[]>([]);
  const [selected, setSelected]         = useState<Set<number>>(new Set());
  const [meetLink, setMeetLink]         = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewType, setInterviewType] = useState('screening');
  const [useAiAgent, setUseAiAgent]         = useState(false);
  const [searchQ, setSearchQ]           = useState('');
  const [loading, setLoading]           = useState(false);
  const [fetching, setFetching]         = useState(true);
  const [logs, setLogs]                 = useState<LogEntry[]>([]);
  const [preview, setPreview]           = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState<number | null>(null);
  const [showPreview, setShowPreview]   = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  /* ── Fetch candidates ── */
  useEffect(() => {
    fetch(`${API}/api/v1/candidates/`)
      .then(r => r.json())
      .then(d => { setCandidates(d); setFetching(false); })
      .catch(() => setFetching(false));
  }, []);

  /* ── Auto-scroll log ── */
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const addLog = (level: LogEntry['level'], message: string) =>
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), level, message }]);

  /* ── Filtered list ── */
  const filtered = candidates.filter(c =>
    [c.name, c.email, c.applied_job].some(f =>
      (f || '').toLowerCase().includes(searchQ.toLowerCase())
    )
  );

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(c => c.id)));
  };

  /* ── Preview email ── */
  const handlePreview = async (candidateId: number) => {
    setPreviewLoading(candidateId);
    try {
      const params = new URLSearchParams({
        meet_link: meetLink || 'https://meet.google.com/example',
        ...(interviewDate && { interview_date: interviewDate }),
      });
      const r = await fetch(`${API}/api/v1/recruiter/preview/${candidateId}?${params}`);
      const d = await r.json();
      setPreview(d);
      setShowPreview(true);
    } catch (e) {
      addLog('error', `Preview failed: ${e}`);
    } finally {
      setPreviewLoading(null);
    }
  };

  /* ── Recruit selected ── */
  const handleRecruit = async () => {
    if (!useAiAgent && !meetLink.trim()) { addLog('error', 'Please enter a Meet link first.'); return; }
    if (selected.size === 0) { addLog('error', 'Please select at least one candidate.'); return; }

    setLoading(true);
    setLogs([]);
    addLog('ai', `🤖 AI Recruiter starting – targeting ${selected.size} candidate(s)…`);

    const ids = Array.from(selected);
    let successCount = 0;

    for (const id of ids) {
      const c = candidates.find(x => x.id === id)!;
      addLog('info', `Processing ${c.name} (${c.email || 'no email'})…`);
      try {
        const r = await fetch(`${API}/api/v1/recruiter/recruit/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meet_link: useAiAgent ? undefined : meetLink,
            interview_date: interviewDate || undefined,
            interview_type: interviewType,
            use_ai_agent: useAiAgent,
          }),
        });
        const d = await r.json();
        if (r.ok) {
          addLog('success', `✅ ${d.message}`);
          successCount++;
        } else {
          addLog('error', `❌ ${c.name}: ${d.detail || 'Unknown error'}`);
        }
      } catch (e) {
        addLog('error', `❌ Network error for ${c.name}: ${e}`);
      }
    }

    addLog('ai', `🎉 Done! ${successCount}/${ids.length} recruitment emails dispatched.`);
    setLoading(false);
  };

  /* ── Log colour map ── */
  const logColors: Record<LogEntry['level'], string> = {
    info:    '#94A3B8',
    success: '#34D399',
    error:   '#F87171',
    ai:      '#A78BFA',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0F0C29,#1a1040,#24243e)', padding: '32px 24px', fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 8px 24px rgba(79,70,229,0.4)' }}>🤖</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>AI Recruiter</h1>
            <p style={{ margin: 0, color: '#94A3B8', fontSize: 14 }}>Claude-powered personalised outreach · Meet link auto-embedded in email</p>
          </div>
        </div>

        {/* Status bar */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 20 }}>
          {[
            { label: 'Total Candidates', value: candidates.length, icon: '👥', color: '#6366F1' },
            { label: 'Selected', value: selected.size, icon: '✅', color: '#10B981' },
            { label: 'With Email', value: candidates.filter(c => c.email).length, icon: '📧', color: '#F59E0B' },
          ].map(s => (
            <div key={s.label} style={{ flex: '1 1 160px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '16px 20px', backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24, alignItems: 'start' }}>

        {/* ── LEFT: Candidate list ── */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, backdropFilter: 'blur(16px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ margin: 0, color: '#E2E8F0', fontSize: 16, fontWeight: 700 }}>Select Candidates</h2>
            <button onClick={toggleAll} style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#A5B4FC', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              {selected.size === filtered.length && filtered.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B', fontSize: 16 }}>🔍</span>
            <input
              id="recruiter-search"
              type="text"
              placeholder="Search candidates…"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px 10px 38px', color: '#E2E8F0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* List */}
          <div style={{ maxHeight: 480, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fetching ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>Loading candidates…</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>No candidates found.</div>
            ) : filtered.map(c => {
              const isSelected = selected.has(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    const s = new Set(selected);
                    isSelected ? s.delete(c.id) : s.add(c.id);
                    setSelected(s);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, cursor: 'pointer', border: `1px solid ${isSelected ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.06)'}`, background: isSelected ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)', transition: 'all 0.15s ease' }}
                >
                  {/* Checkbox */}
                  <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${isSelected ? '#6366F1' : '#475569'}`, background: isSelected ? '#6366F1' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                    {isSelected && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
                  </div>
                  {/* Avatar */}
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: `linear-gradient(135deg,hsl(${(c.id * 47) % 360},60%,40%),hsl(${(c.id * 47 + 60) % 360},70%,55%))`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                    {(c.name || '?').charAt(0).toUpperCase()}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#F1F5F9', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name || 'Unnamed'}</div>
                    <div style={{ color: '#64748B', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.email || <span style={{ color: '#F87171' }}>No email</span>}</div>
                    {c.applied_job && <div style={{ marginTop: 2 }}><span style={{ background: 'rgba(99,102,241,0.2)', color: '#A5B4FC', fontSize: 11, padding: '2px 8px', borderRadius: 100 }}>{c.applied_job}</span></div>}
                  </div>
                  {/* Preview btn */}
                  <button
                    id={`preview-btn-${c.id}`}
                    onClick={e => { e.stopPropagation(); handlePreview(c.id); }}
                    disabled={previewLoading === c.id}
                    title="Preview AI email"
                    style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', color: '#C4B5FD', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, flexShrink: 0, opacity: previewLoading === c.id ? 0.5 : 1 }}
                  >
                    {previewLoading === c.id ? '…' : '👁 Preview'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: Controls + Log ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Controls card */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, backdropFilter: 'blur(16px)' }}>
            <h2 style={{ margin: '0 0 20px', color: '#E2E8F0', fontSize: 16, fontWeight: 700 }}>⚙️ Recruitment Settings</h2>

            {/* AI Agent Toggle */}
            <div 
              onClick={() => setUseAiAgent(!useAiAgent)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: useAiAgent ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${useAiAgent ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, marginBottom: 20, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div>
                <div style={{ color: useAiAgent ? '#A5B4FC' : '#E2E8F0', fontSize: 14, fontWeight: 700 }}>AI Agent Mode</div>
                <div style={{ color: '#64748B', fontSize: 11 }}>Nexus will conduct the interview</div>
              </div>
              <div style={{ width: 44, height: 24, borderRadius: 100, background: useAiAgent ? '#6366F1' : '#334155', position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ width: 18, height: 18, borderRadius: 100, background: '#fff', position: 'absolute', top: 3, left: useAiAgent ? 23 : 3, transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} />
              </div>
            </div>

            {!useAiAgent && (
              <>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Google Meet / Zoom Link *</label>
                <input
                  id="meet-link-input"
                  type="url"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={meetLink}
                  onChange={e => setMeetLink(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: `1px solid ${meetLink ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, padding: '11px 14px', color: '#E2E8F0', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }}
                />
              </>
            )}

            <label style={{ display: 'block', color: '#94A3B8', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Interview Date & Time</label>
            <input
              id="interview-date-input"
              type="datetime-local"
              value={interviewDate}
              onChange={e => setInterviewDate(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#E2E8F0', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 16, colorScheme: 'dark' }}
            />

            <label style={{ display: 'block', color: '#94A3B8', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Interview Type</label>
            <select
              id="interview-type-select"
              value={interviewType}
              onChange={e => setInterviewType(e.target.value)}
              style={{ width: '100%', background: '#1E1B4B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#E2E8F0', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 24 }}
            >
              <option value="screening">📋 Screening</option>
              <option value="technical">💻 Technical</option>
              <option value="final">🏆 Final Round</option>
            </select>

            <button
              id="recruit-btn"
              onClick={handleRecruit}
              disabled={loading || selected.size === 0 || (!useAiAgent && !meetLink.trim())}
              style={{ width: '100%', padding: '16px', background: (loading || selected.size === 0 || (!useAiAgent && !meetLink.trim())) ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg,#4F46E5,#7C3AED)', border: 'none', borderRadius: 14, color: '#fff', fontSize: 16, fontWeight: 700, cursor: (loading || selected.size === 0 || (!useAiAgent && !meetLink.trim())) ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: (loading || selected.size === 0 || (!useAiAgent && !meetLink.trim())) ? 'none' : '0 8px 24px rgba(79,70,229,0.4)', letterSpacing: '0.02em' }}
            >
              {loading ? '⏳ Recruiting…' : `🚀 ${useAiAgent ? 'Agent' : 'Recruit'} ${selected.size > 0 ? selected.size : ''} Candidate${selected.size !== 1 ? 's' : ''}`}
            </button>

            {selected.size === 0 && (
              <p style={{ textAlign: 'center', color: '#475569', fontSize: 12, margin: '12px 0 0' }}>Select candidates from the list to continue</p>
            )}
          </div>

          {/* Live log */}
          <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 20, backdropFilter: 'blur(16px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: '#94A3B8', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>🖥 Live Log</h3>
              {logs.length > 0 && <button onClick={() => setLogs([])} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 12 }}>Clear</button>}
            </div>
            <div ref={logRef} style={{ minHeight: 120, maxHeight: 240, overflowY: 'auto', fontFamily: 'monospace', fontSize: 12 }}>
              {logs.length === 0 ? (
                <p style={{ color: '#334155', margin: 0, padding: '20px 0', textAlign: 'center' }}>Awaiting recruitment run…</p>
              ) : logs.map((l, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6, lineHeight: 1.5 }}>
                  <span style={{ color: '#334155', flexShrink: 0 }}>{l.time}</span>
                  <span style={{ color: logColors[l.level] }}>{l.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Email Preview Modal ── */}
      {showPreview && preview && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(8px)' }}
          onClick={() => setShowPreview(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#0F172A', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 24, width: '100%', maxWidth: 680, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
          >
            {/* Modal header */}
            <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, color: '#E2E8F0', fontSize: 16, fontWeight: 700 }}>📧 Email Preview</h3>
                <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 13 }}>To: {preview.candidate_email} · Re: {preview.role}</p>
              </div>
              <button id="close-preview-btn" onClick={() => setShowPreview(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, width: 32, height: 32, color: '#94A3B8', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            {/* Subject */}
            <div style={{ padding: '12px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(99,102,241,0.08)' }}>
              <span style={{ color: '#64748B', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Subject: </span>
              <span style={{ color: '#A5B4FC', fontSize: 14, fontWeight: 600 }}>{preview.subject}</span>
            </div>
            {/* HTML Preview */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 28, background: '#F8FAFC' }}>
              <div dangerouslySetInnerHTML={{ __html: preview.html_preview }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
