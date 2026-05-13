import { useState, useEffect } from 'react';
import { Train, Zap, ArrowRight, Terminal } from 'lucide-react';
import StatusChip from './StatusChip';
import { fetchStats } from '../api';

/* ---------- Planet / Mountain Hero (unchanged) ---------- */
function PlanetHero() {
  return (
    <div
      className="relative overflow-hidden rounded-xl group"
      style={{
        height: 500,
        background: 'var(--surface-container-lowest)',
        border: '1px solid var(--outline-variant)',
      }}
    >
      <div
        className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
        style={{
          backgroundImage: 'url("/dashboard_planet.avif")',
          filter: 'brightness(0.7) contrast(1.1)',
        }}
      />
      <div className="absolute inset-0 z-1 bg-black/30" />

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-6">
        <div className="animate-fade-up">
          <h2
            className="font-mono text-5xl md:text-7xl font-bold mb-4 tracking-tighter"
            style={{
              background: 'linear-gradient(to bottom, #fff, #b9cacb)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 10px 30px rgba(0,0,0,0.5)',
            }}
          >
            Mission Control AI
          </h2>
          <div className="flex flex-col items-center">
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-[#00f2ff] to-transparent mb-6 opacity-50" />
            <p
              className="font-mono text-xl md:text-2xl tracking-[0.3em] font-light"
              style={{
                color: 'var(--primary-container)',
                textShadow: '0 0 20px rgba(0,242,255,0.4)',
              }}
            >
              MAXIMUM EFFICIENCY · MINIMUM DELAY
            </p>
          </div>
        </div>
      </div>

      <div className="absolute top-6 left-8 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center glass border-[#00f2ff]/30 shadow-[0_0_15px_rgba(0,242,255,0.2)]">
            <Zap size={18} className="text-[#00f2ff]" />
          </div>
          <div>
            <p className="font-mono text-[10px] tracking-widest text-[#00f2ff]/70 uppercase">System Status</p>
            <p className="font-mono text-xs font-bold text-white">NOMINAL</p>
          </div>
        </div>
      </div>

      <div className="absolute top-6 right-8 z-20 text-right">
        <button className="px-6 py-2.5 rounded-full font-mono text-xs font-bold tracking-widest transition-all hover:scale-105 glow-teal"
          style={{ background: 'var(--primary-container)', color: 'var(--on-primary)' }}>
          INITIATE AUTO-BOOK
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 glass-teal border-t border-[#00f2ff]/10 py-3 px-8 flex justify-between items-center">
        <div className="flex gap-10">
          {[
            { k: 'LATENCY', v: '42ms' },
            { k: 'SESSIONS', v: '3 ACTIVE' },
            { k: 'UPTIME', v: '99.9%' },
          ].map(({ k, v }) => (
            <div key={k}>
              <p className="font-mono text-[8px] tracking-[0.2em] text-[#00f2ff]/50">{k}</p>
              <p className="font-mono text-xs font-bold text-white">{v}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00f2ff] animate-status" />
          <p className="font-mono text-[10px] tracking-widest text-[#00f2ff]">AI CO-PILOT ENGAGED</p>
        </div>
      </div>

      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 opacity-40">
        <Train size={14} className="text-white" />
        <p className="font-mono text-[8px] tracking-[0.3em] text-white">SCROLL_DOWN</p>
      </div>
    </div>
  );
}

/* ---------- Main Dashboard ---------- */
export default function Dashboard({ onNavigate }) {
  const [time, setTime] = useState(new Date());
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = t => t.toLocaleTimeString('en-IN', { hour12: false });

  const statBlocks = stats
    ? [
        {
          label: 'TOTAL BOOKINGS',
          value: stats.total_bookings.toLocaleString(),
          sub: 'All-time booking missions',
        },
        {
          label: 'SUCCESSFUL BOOKINGS',
          value: stats.total_bookings > 0
            ? `${((stats.successful_bookings / stats.total_bookings) * 100).toFixed(1)}%`
            : '—',
          sub: 'OPTIMAL Execution path confirmed',
          accent: true,
        },
        {
          label: 'PENDING BOOKINGS',
          value: String(stats.pending_bookings),
          sub: 'QUEUEING Waiting for TATKAL window',
          violet: true,
        },
      ]
    : [
        { label: 'TOTAL BOOKINGS', value: '—', sub: '' },
        { label: 'SUCCESSFUL BOOKINGS', value: '—', sub: '', accent: true },
        { label: 'PENDING BOOKINGS', value: '—', sub: '', violet: true },
      ];

  const recentJobs = stats?.recent_jobs ?? [];

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Title row */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: 'var(--primary-container)' }}>
            // SYSTEM OVERVIEW
          </p>
          <h1 className="font-mono text-xl font-bold" style={{ color: 'var(--on-surface)' }}>Mission Control</h1>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg font-bold glow-teal-text" style={{ color: 'var(--primary-container)' }}>
            {fmt(time)}
          </p>
          <p className="font-mono text-[10px]" style={{ color: 'var(--on-surface-variant)' }}>
            {time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Planet hero */}
      <PlanetHero />

      {/* Stat blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statBlocks.map(({ label, value, sub, accent, violet }) => (
          <div
            key={label}
            className="glass hud-border rounded p-5"
            style={{ borderColor: accent ? 'rgba(0,242,255,0.25)' : violet ? 'rgba(168,85,247,0.25)' : undefined }}
          >
            <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: 'var(--on-surface-variant)' }}>
              {label}
            </p>
            <p
              className="font-mono text-4xl font-bold mb-2"
              style={{ color: accent ? 'var(--primary-container)' : violet ? '#ddb7ff' : 'var(--on-surface)' }}
            >
              {loading ? '...' : value}
            </p>
            <p className="font-mono text-[10px]" style={{ color: 'var(--on-surface-variant)' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* EXECUTION_LOGS.EXE */}
      <div className="glass rounded overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: 'var(--outline-variant)', background: 'rgba(0,0,0,0.25)' }}
        >
          <Terminal size={14} style={{ color: 'var(--primary-container)' }} />
          <span className="font-mono text-xs tracking-widest font-bold flex-1" style={{ color: 'var(--on-surface)' }}>
            EXECUTION_LOGS.EXE
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: '#ff5555' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#a855f7' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#00f2ff' }} />
          </div>
        </div>

        {/* Table header */}
        <div
          className="grid font-mono text-[9px] tracking-widest px-4 py-2 border-b"
          style={{
            gridTemplateColumns: '120px 1fr 150px 1fr',
            borderColor: 'var(--outline-variant)',
            color: 'var(--on-surface-variant)',
            background: 'rgba(0,0,0,0.15)',
          }}
        >
          <span>JOB ID</span>
          <span>ROUTE</span>
          <span>STATUS</span>
          <span>TIMESTAMP</span>
        </div>

        {/* Job rows */}
        <div className="divide-y" style={{ borderColor: 'var(--outline-variant)' }}>
          {loading && (
            <div className="px-4 py-6 text-center">
              <p className="font-mono text-xs animate-blink" style={{ color: 'var(--on-surface-variant)' }}>
                LOADING...
              </p>
            </div>
          )}
          {!loading && recentJobs.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="font-mono text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                No missions yet. Launch your first booking.
              </p>
            </div>
          )}
          {recentJobs.map((job, i) => (
            <div
              key={job.id}
              className="grid items-center px-4 py-3 hover:bg-white/[0.02] transition-colors animate-fade-up"
              style={{ gridTemplateColumns: '120px 1fr 150px 1fr', animationDelay: `${i * 60}ms` }}
            >
              <span className="font-mono text-xs font-bold truncate" style={{ color: 'var(--primary-container)' }}>
                {job.id.slice(0, 8).toUpperCase()}
              </span>
              <span className="font-mono text-xs flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
                {job.source}
                <ArrowRight size={11} style={{ color: 'var(--outline)' }} />
                {job.destination}
              </span>
              <StatusChip status={job.status} />
              <span className="font-mono text-[10px]" style={{ color: 'var(--on-surface-variant)' }}>
                {new Date(job.created_at).toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>

        {/* Footer row */}
        <div
          className="flex items-center justify-between px-4 py-3 border-t"
          style={{ borderColor: 'var(--outline-variant)', background: 'rgba(0,0,0,0.15)' }}
        >
          <button
            onClick={() => onNavigate('history')}
            className="font-mono text-[10px] tracking-widest transition-opacity hover:opacity-80"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            VIEW FULL SYSTEM LOGS [F12]
          </button>
          <button
            onClick={() => onNavigate('booking')}
            className="flex items-center gap-2 px-5 py-2 rounded font-mono text-sm font-bold tracking-wide glow-teal transition-all hover:scale-105"
            style={{ background: 'var(--primary-container)', color: 'var(--on-primary)' }}
          >
            New Booking <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
