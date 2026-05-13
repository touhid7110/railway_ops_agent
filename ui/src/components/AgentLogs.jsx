import { useState, useEffect, useRef } from 'react';
import { Terminal, Pause, Play, Trash2, AlertTriangle } from 'lucide-react';
import { submitOtp, fetchJob } from '../api';

/* ---------- Log config ---------- */
const CHIP = {
  NAV:     { bg: 'rgba(168,85,247,0.2)',   color: '#ddb7ff' },
  AUTH:    { bg: 'rgba(0,242,255,0.15)',   color: '#00f2ff' },
  FORM:    { bg: 'rgba(255,255,255,0.08)', color: '#b9cacb' },
  INFO:    { bg: 'transparent',            color: '#849495', border: '1px solid #3a494b' },
  OTP:     { bg: 'rgba(255,214,0,0.12)',   color: '#ffd600' },
  PAYMENT: { bg: 'rgba(0,242,255,0.12)',   color: '#00f2ff' },
  ERROR:   { bg: 'rgba(255,180,171,0.1)',  color: '#ffb4ab' },
  ERR:     { bg: 'rgba(255,180,171,0.1)',  color: '#ffb4ab' },
};

const STEPS = ['LOGIN', 'SEARCH', 'SELECTION', 'PROCESSING', 'CONFIRMED'];

function StepTracker({ activeStep }) {
  return (
    <div className="flex items-center justify-center gap-0 px-4 py-4">
      {STEPS.map((label, i) => {
        const done = i < activeStep;
        const active = i === activeStep;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all"
                style={{
                  background: done || active ? 'var(--primary-container)' : 'var(--surface-container-high)',
                  color: done || active ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                  border: done || active ? 'none' : '1px solid var(--outline-variant)',
                  boxShadow: active ? '0 0 12px rgba(0,242,255,0.5)' : 'none',
                }}
              >
                {i + 1}
              </div>
              <span
                className="font-mono text-[8px] tracking-wide whitespace-nowrap"
                style={{ color: done || active ? 'var(--primary-container)' : 'var(--on-surface-variant)' }}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="w-10 h-px mb-4 flex-shrink-0"
                style={{ background: i < activeStep ? 'var(--primary-container)' : 'var(--outline-variant)' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function LogRow({ log }) {
  const chip = CHIP[log.tag] || CHIP.INFO;
  return (
    <div className="flex items-start gap-2 py-0.5 font-mono text-xs group hover:bg-white/[0.02] px-2 -mx-2 rounded animate-slide-in">
      <span className="flex-shrink-0 text-[9px] pt-0.5" style={{ color: 'var(--on-surface-variant)', minWidth: 52 }}>{log.ts}</span>
      <span
        className="flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-sm font-bold"
        style={{ background: chip.bg, color: chip.color, border: chip.border }}
      >{log.tag}</span>
      <span style={{ color: log.tag === 'ERROR' || log.tag === 'ERR' ? '#ffb4ab' : 'var(--on-surface-variant)' }}>
        {log.msg || log.message}
      </span>
    </div>
  );
}

function BrowserPreview({ currentUrl }) {
  return (
    <div className="flex flex-col h-full rounded overflow-hidden" style={{ border: '1px solid var(--outline-variant)' }}>
      <div
        className="flex items-center gap-2 px-3 py-2 border-b flex-shrink-0"
        style={{ background: 'var(--surface-container-high)', borderColor: 'var(--outline-variant)' }}
      >
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5555' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#22c55e' }} />
        </div>
        <div
          className="flex-1 px-2 py-0.5 rounded font-mono text-[9px] truncate"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}
        >
          {currentUrl || 'https://www.irctc.co.in'}
        </div>
      </div>
      <div
        className="flex-1 flex flex-col items-center justify-center gap-3"
        style={{ background: 'var(--surface-container-lowest)' }}
      >
        <div className="space-y-2 w-full max-w-[180px]">
          {[40, 60, 40, 55, 40].map((w, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full"
              style={{ width: `${w}%`, background: 'var(--surface-container-high)', marginLeft: i % 2 ? 'auto' : 0 }}
            />
          ))}
        </div>
        <div
          className="px-4 py-2 rounded font-mono text-[10px] font-bold tracking-widest animate-blink"
          style={{ background: 'rgba(0,242,255,0.08)', color: 'var(--primary-container)', border: '1px solid rgba(0,242,255,0.2)' }}
        >
          AGENT ACTIVE...
        </div>
      </div>
    </div>
  );
}

/* ---------- No active job placeholder ---------- */
function NoJob({ onNavigate }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 h-64">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,242,255,0.05)', border: '1px solid rgba(0,242,255,0.15)' }}>
        <Terminal size={28} style={{ color: 'var(--primary-container)' }} />
      </div>
      <div className="text-center">
        <p className="font-mono text-sm font-bold mb-1" style={{ color: 'var(--on-surface)' }}>NO ACTIVE MISSION</p>
        <p className="font-mono text-[10px]" style={{ color: 'var(--on-surface-variant)' }}>
          Launch a booking to see real-time agent execution here.
        </p>
      </div>
      <button
        onClick={() => onNavigate('booking')}
        className="px-5 py-2 rounded font-mono text-xs font-bold tracking-wide glow-teal"
        style={{ background: 'var(--primary-container)', color: 'var(--on-primary)' }}
      >
        START NEW MISSION
      </button>
    </div>
  );
}

/* ---------- Main component ---------- */
export default function AgentLogs({ jobId, activeJobId, onNavigate }) {
  const id = jobId || activeJobId;

  const [logs, setLogs]           = useState([]);
  const [jobInfo, setJobInfo]     = useState(null);
  const [otpRequired, setOtpRequired] = useState(false);
  const [otp, setOtp]             = useState('');
  const [otpStatus, setOtpStatus] = useState('');
  const [status, setStatus]       = useState('running');
  const [currentUrl, setCurrentUrl] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const bottomRef                 = useRef(null);
  const esRef                     = useRef(null);

  const activeStep = Math.min(Math.floor((logs.length / 10) * STEPS.length), STEPS.length - 1);
  const isRunning = status === 'running';

  const fmtTs = (ts) => {
    try {
      const d = new Date(ts);
      return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
    } catch { return ts; }
  };

  useEffect(() => {
    if (!id) return;
    fetchJob(id).then(j => {
      setJobInfo(j);
      setStatus(j.status);
      if (j.logs?.length) {
        setLogs(j.logs.map(l => ({ ts: fmtTs(l.ts), tag: l.tag, msg: l.message })));
      }
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id) return;
    if (esRef.current) { esRef.current.close(); }

    const es = new EventSource(`/api/jobs/${id}/logs/stream`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (event.type === 'log') {
          setLogs(l => [...l, { ts: fmtTs(event.ts), tag: event.tag, msg: event.message }]);
        } else if (event.type === 'otp_required') {
          setOtpRequired(true);
          setStatus('waiting_otp');
        } else if (event.type === 'done') {
          setStatus('success');
          setPaymentUrl(event.payment_url || '');
          es.close();
        } else if (event.type === 'error') {
          setStatus('failed');
          const errMsg = event.message || 'Unknown error';
          setLogs(l => [...l, { ts: fmtTs(event.ts || new Date().toISOString()), tag: 'ERROR', msg: errMsg }]);
          if (event.detail) {
            // split traceback into individual lines for readability
            event.detail.split('\n').filter(Boolean).forEach(line => {
              setLogs(l => [...l, { ts: '—', tag: 'ERROR', msg: line }]);
            });
          }
          es.close();
        }

        // track URL from NAV logs
        if (event.tag === 'NAV' && event.message?.includes('http')) {
          const match = event.message.match(/https?:\/\/[^\s]+/);
          if (match) setCurrentUrl(match[0]);
        }
      } catch {}
    };

    es.onerror = () => { es.close(); };

    return () => { es.close(); };
  }, [id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const handleOtp = async () => {
    if (!otp.trim()) return;
    setOtpStatus('Submitting...');
    try {
      await submitOtp(id, otp.trim());
      setOtpStatus('OTP submitted. Agent resuming...');
      setOtpRequired(false);
      setStatus('running');
      setOtp('');
    } catch (e) {
      setOtpStatus(`Error: ${e.message}`);
    }
  };

  if (!id) return (
    <div className="space-y-4 animate-fade-up">
      <div>
        <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: 'var(--primary-container)' }}>// LIVE AGENT EXECUTION</p>
        <h1 className="font-mono text-2xl font-bold" style={{ color: 'var(--on-surface)' }}>LIVE AGENT</h1>
      </div>
      <div className="glass rounded p-8">
        <NoJob onNavigate={onNavigate} />
      </div>
    </div>
  );

  const statusLabel = {
    running: 'RUNNING',
    waiting_otp: 'WAITING FOR OTP',
    success: 'COMPLETED',
    failed: 'FAILED',
    queued: 'QUEUED',
  }[status] || status.toUpperCase();

  const statusColor = {
    running: '#00f2ff',
    waiting_otp: '#ffd600',
    success: '#00f2ff',
    failed: '#ffb4ab',
    queued: '#849495',
  }[status] || '#849495';

  return (
    <div className="space-y-4 animate-fade-up flex flex-col" style={{ minHeight: '80vh' }}>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: 'var(--primary-container)' }}>// LIVE AGENT EXECUTION</p>
          <h1 className="font-mono text-2xl font-bold" style={{ color: 'var(--on-surface)' }}>{statusLabel}</h1>
          {jobInfo && (
            <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>
              TARGET: {jobInfo.source} → {jobInfo.destination} | {jobInfo.travel_class} | {jobInfo.date}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {status === 'success' && paymentUrl && (
            <a
              href={paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded font-mono text-xs font-bold tracking-wide glow-teal transition-all hover:scale-105"
              style={{ background: 'var(--primary-container)', color: 'var(--on-primary)' }}
            >
              COMPLETE PAYMENT →
            </a>
          )}
          <button
            onClick={() => onNavigate('booking')}
            className="flex items-center gap-1.5 px-4 py-2 rounded font-mono text-xs font-bold tracking-wide transition-all hover:scale-105"
            style={{ background: 'rgba(255,180,171,0.1)', color: '#ffb4ab', border: '1px solid rgba(255,180,171,0.3)' }}
          >
            <AlertTriangle size={12} /> NEW MISSION
          </button>
        </div>
      </div>

      {/* Step progress */}
      <div className="glass rounded">
        <StepTracker activeStep={status === 'success' ? STEPS.length : activeStep} />
      </div>

      {/* OTP + log + browser */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1">

        {/* OTP panel */}
        <div className="lg:col-span-2 glass hud-border rounded p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: otpRequired ? '#ffd600' : statusColor }}
            />
            <p className="font-mono text-[10px] tracking-widest font-bold" style={{ color: 'var(--primary-container)' }}>
              OTP_INTERCEPT
            </p>
          </div>

          {otpRequired ? (
            <>
              <p className="font-mono text-[10px] leading-5" style={{ color: 'var(--on-surface-variant)' }}>
                <span style={{ color: '#ffb4ab' }}>CRITICAL:</span> IRCTC requires OTP verification.
                Enter the code sent to your registered mobile.
              </p>
              <div>
                <label className="font-mono text-[10px] tracking-widest mb-1 block" style={{ color: 'var(--on-surface-variant)' }}>
                  ENTER CODE_
                </label>
                <input
                  type="text"
                  maxLength={8}
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleOtp()}
                  placeholder="• • • • • • • •"
                  className="w-full px-3 py-3 font-mono text-lg text-center rounded tracking-[0.5em]"
                  style={{ background: 'var(--surface-container-high)', border: '1px solid rgba(0,242,255,0.3)', color: 'var(--on-surface)' }}
                />
              </div>
              {otpStatus && (
                <p className="font-mono text-[10px]" style={{ color: 'var(--on-surface-variant)' }}>{otpStatus}</p>
              )}
              <button
                onClick={handleOtp}
                className="w-full py-2.5 rounded font-mono text-xs font-bold tracking-wide glow-teal transition-all hover:scale-[1.02]"
                style={{ background: 'var(--primary-container)', color: 'var(--on-primary)' }}
              >
                VALIDATE & RESUME
              </button>
            </>
          ) : (
            <p className="font-mono text-[10px] leading-5" style={{ color: 'var(--on-surface-variant)' }}>
              {status === 'success'
                ? 'Booking completed successfully. Check your email for payment link.'
                : status === 'failed'
                ? 'Agent encountered an error. See logs for details.'
                : 'Agent is executing. OTP panel will activate if required.'}
            </p>
          )}

          {/* Status row */}
          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--outline-variant)' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusColor }} />
              <span className="font-mono text-[10px]" style={{ color: 'var(--on-surface-variant)' }}>
                {statusLabel}
              </span>
            </div>
            <span className="font-mono text-[10px] truncate max-w-[100px]" style={{ color: 'var(--on-surface-variant)' }}>
              {id?.slice(0, 8)}
            </span>
          </div>
        </div>

        {/* Right: log + browser */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="glass rounded flex flex-col" style={{ minHeight: 280 }}>
            <div
              className="flex items-center gap-2 px-4 py-2 border-b flex-shrink-0"
              style={{ borderColor: 'var(--outline-variant)', background: 'rgba(0,0,0,0.2)' }}
            >
              <Terminal size={13} style={{ color: 'var(--primary-container)' }} />
              <span className="font-mono text-[10px] tracking-wide flex-1" style={{ color: 'var(--on-surface-variant)' }}>
                AGENT_LOG_STREAM_V1.0
              </span>
              <button
                onClick={() => setLogs([])}
                className="flex items-center gap-1 px-2 py-1 rounded font-mono text-[10px]"
                style={{ background: 'var(--surface-container-high)', color: '#ffb4ab' }}
              >
                <Trash2 size={10} /> CLEAR
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-0.5" style={{ maxHeight: 260 }}>
              {logs.length === 0 && (
                <p className="font-mono text-[10px] animate-blink" style={{ color: 'var(--on-surface-variant)' }}>
                  Connecting to agent stream...
                </p>
              )}
              {logs.map((log, i) => <LogRow key={i} log={log} />)}
              {isRunning && (
                <div className="flex items-center gap-2 px-2 font-mono text-xs">
                  <span style={{ color: 'var(--on-surface-variant)', minWidth: 52 }} className="text-[9px]">—</span>
                  <span className="animate-blink text-[10px]" style={{ color: 'var(--primary-container)' }}>█</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="flex-1" style={{ minHeight: 180 }}>
            <BrowserPreview currentUrl={currentUrl} />
          </div>
        </div>
      </div>
    </div>
  );
}
