import { useState, useEffect } from 'react';
import { Search, Calendar, Filter, ChevronRight } from 'lucide-react';
import StatusChip from './StatusChip';
import { fetchJobs, fetchStats } from '../api';

const TABS = ['TERMINAL', 'ARCHIVES', 'NETWORK'];

export default function MissionHistory({ onNavigate, setActiveJobId }) {
  const [activeTab, setActiveTab] = useState('ARCHIVES');
  const [query, setQuery]         = useState('');
  const [jobs, setJobs]           = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([fetchJobs(), fetchStats()])
      .then(([j, s]) => { setJobs(j); setStats(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleString('en-IN'); } catch { return iso; }
  };

  const filtered = jobs.filter(j =>
    query === '' ||
    j.id.toLowerCase().includes(query.toLowerCase()) ||
    j.source.toLowerCase().includes(query.toLowerCase()) ||
    j.destination.toLowerCase().includes(query.toLowerCase())
  );

  const footerStats = [
    { label: 'TOTAL_EXECUTIONS', value: stats ? stats.total_bookings.toLocaleString() : '—' },
    {
      label: 'SUCCESS_RATE',
      value: stats && stats.total_bookings > 0
        ? `${((stats.successful_bookings / stats.total_bookings) * 100).toFixed(1)}%`
        : '—',
    },
    {
      label: 'AVG_LATENCY',
      value: stats ? `${Math.round(stats.avg_latency_ms)}ms` : '—',
    },
    { label: 'PENDING', value: stats ? String(stats.pending_bookings) : '—' },
  ];

  const viewJob = (job) => {
    setActiveJobId(job.id);
    onNavigate('logs');
  };

  return (
    <div className="space-y-5 animate-fade-up">

      {/* Top tab nav */}
      <div className="flex items-center gap-0 border-b" style={{ borderColor: 'var(--outline-variant)' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-5 py-2.5 font-mono text-[10px] tracking-widest font-bold transition-colors"
            style={{
              color: activeTab === tab ? 'var(--primary-container)' : 'var(--on-surface-variant)',
              borderBottom: activeTab === tab ? '2px solid var(--primary-container)' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Breadcrumb + heading */}
      <div>
        <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: 'var(--on-surface-variant)' }}>
          ARCHIVE_SYSTEM_V.4.2
        </p>
        <h1 className="font-mono text-2xl font-bold" style={{ color: 'var(--on-surface)' }}>MISSION LOGS</h1>
      </div>

      {/* Table card */}
      <div className="glass rounded overflow-hidden">
        {/* Search + filter bar */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: 'var(--outline-variant)', background: 'rgba(0,0,0,0.2)' }}
        >
          <div
            className="flex items-center flex-1 max-w-xs rounded"
            style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', overflow: 'hidden' }}
          >
            <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', paddingLeft: 10, paddingRight: 6 }}>
              <Search size={13} style={{ color: 'var(--on-surface-variant)' }} />
            </span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="SEARCH MISSIONS..."
              className="font-mono text-xs"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--on-surface)', padding: '6px 10px 6px 0' }}
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-[10px] font-bold tracking-wide"
              style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)', border: '1px solid var(--outline-variant)' }}
            >
              <Calendar size={11} /> DATE
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-[10px] font-bold tracking-wide"
              style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)', border: '1px solid var(--outline-variant)' }}
            >
              <Filter size={11} /> STATUS
            </button>
          </div>
        </div>

        {/* Column headers */}
        <div
          className="grid font-mono text-[9px] tracking-widest px-4 py-2 border-b"
          style={{
            gridTemplateColumns: '110px 160px 1fr 130px 110px 48px',
            borderColor: 'var(--outline-variant)',
            color: 'var(--on-surface-variant)',
            background: 'rgba(0,0,0,0.15)',
          }}
        >
          <span>MISSION_ID</span>
          <span>TIMESTAMP</span>
          <span>ROUTE</span>
          <span>CLASS</span>
          <span>STATUS</span>
          <span>ACTION</span>
        </div>

        {/* Rows */}
        <div className="divide-y" style={{ borderColor: 'var(--outline-variant)' }}>
          {loading && (
            <div className="px-4 py-8 text-center">
              <p className="font-mono text-xs animate-blink" style={{ color: 'var(--on-surface-variant)' }}>LOADING...</p>
            </div>
          )}

          {!loading && filtered.map((j, i) => (
            <div
              key={j.id}
              onClick={() => viewJob(j)}
              className="grid items-center px-4 py-3.5 hover:bg-white/[0.02] transition-colors animate-fade-up cursor-pointer"
              style={{ gridTemplateColumns: '110px 160px 1fr 130px 110px 48px', animationDelay: `${i * 60}ms` }}
            >
              <span className="font-mono text-xs font-bold truncate" style={{ color: 'var(--primary-container)' }}>
                {j.id.slice(0, 8).toUpperCase()}
              </span>
              <span className="font-mono text-[10px]" style={{ color: 'var(--on-surface-variant)' }}>
                {fmtDate(j.created_at)}
              </span>
              <span className="font-mono text-xs flex items-center gap-1.5" style={{ color: 'var(--on-surface)' }}>
                {j.source}
                <span style={{ color: 'var(--outline)' }}>→</span>
                {j.destination}
              </span>
              <span className="font-mono text-[10px]" style={{ color: 'var(--on-surface-variant)' }}>
                {j.travel_class} · {j.booking_type}
              </span>
              <StatusChip status={j.status} />
              <button style={{ color: 'var(--on-surface-variant)' }} className="hover:text-white transition-colors">
                <ChevronRight size={15} />
              </button>
            </div>
          ))}

          {!loading && filtered.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="font-mono text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                {jobs.length === 0 ? 'No missions yet. Launch your first booking.' : 'No missions match your query.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Aggregate stats footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {footerStats.map(({ label, value }) => (
          <div key={label} className="glass rounded p-4">
            <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: 'var(--on-surface-variant)' }}>{label}</p>
            <p className="font-mono text-2xl font-bold" style={{ color: 'var(--on-surface)' }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
