import { useState } from 'react';
import { Search, RefreshCw, MapPin, Clock, Users } from 'lucide-react';
import StatusChip from './StatusChip';

const MOCK = {
  '2401234567890': {
    pnr: '2401234567890',
    train: '12301 — Rajdhani Express',
    from: 'New Delhi (NDLS)',
    to: 'Howrah Junction (HWH)',
    dep: '16:55, 15-May-2026',
    arr: '10:00, 16-May-2026',
    cls: '3A',
    quota: 'GN',
    passengers: [
      { name: 'TOUHID M', age: 28, sex: 'M', berth: 'S5-32', status: 'AVAILABLE' },
      { name: 'ARYAN K',  age: 25, sex: 'M', berth: 'S5-33', status: 'AVAILABLE' },
    ],
    chart: 'CHART NOT PREPARED',
  },
};

export default function PNRStatus() {
  const [pnr, setPnr]       = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const check = () => {
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      setResult(MOCK[pnr] || { error: 'PNR not found or invalid.' });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-4 animate-fade-up">
      <div>
        <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: 'var(--primary-container)' }}>// PNR ENQUIRY MODULE</p>
        <h1 className="font-mono text-xl font-bold" style={{ color: 'var(--on-surface)' }}>PNR Status</h1>
      </div>

      {/* Input */}
      <div className="glass rounded p-5">
        <label className="font-mono text-[10px] tracking-widest mb-2 block" style={{ color: 'var(--on-surface-variant)' }}>ENTER 10-DIGIT PNR</label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm" style={{ color: 'var(--primary-container)' }}>&gt;</span>
            <input
              value={pnr}
              onChange={e => setPnr(e.target.value)}
              placeholder="2401234567890"
              maxLength={13}
              className="w-full pl-8 pr-3 py-2.5 font-mono text-sm rounded tracking-widest"
              style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)' }}
            />
          </div>
          <button
            onClick={check}
            disabled={loading}
            className="px-5 py-2.5 rounded font-mono text-sm font-bold tracking-wide glow-teal flex items-center gap-2 transition-all hover:scale-105"
            style={{ background: 'var(--primary-container)', color: 'var(--on-primary)' }}
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
            {loading ? 'CHECKING...' : 'CHECK PNR'}
          </button>
        </div>
        <p className="font-mono text-[9px] mt-2" style={{ color: 'var(--on-surface-variant)' }}>
          Try demo PNR:{' '}
          <span
            className="cursor-pointer"
            style={{ color: 'var(--primary-container)' }}
            onClick={() => setPnr('2401234567890')}
          >
            2401234567890
          </span>
        </p>
      </div>

      {/* Result */}
      {result && !result.error && (
        <div className="glass rounded overflow-hidden animate-fade-up">
          <div className="px-4 py-3 border-b flex flex-wrap items-center gap-4"
            style={{ borderColor: 'var(--outline-variant)', background: 'rgba(0,0,0,0.2)' }}>
            <span className="font-mono text-xs font-bold" style={{ color: 'var(--primary-container)' }}>PNR: {result.pnr}</span>
            <span className="font-mono text-xs" style={{ color: 'var(--on-surface)' }}>{result.train}</span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded"
              style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)' }}>
              {result.chart}
            </span>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: MapPin, color: 'var(--primary-container)', label: 'FROM', val: result.from, sub: result.dep },
                { icon: MapPin, color: 'var(--secondary)', label: 'TO',   val: result.to,   sub: result.arr },
                { icon: Clock,  color: 'var(--on-surface-variant)', label: 'CLASS / QUOTA', val: `${result.cls} / ${result.quota}`, sub: '' },
              ].map(({ icon: Icon, color, label, val, sub }) => (
                <div key={label} className="flex items-start gap-2">
                  <Icon size={14} style={{ color, marginTop: 2 }} />
                  <div>
                    <p className="font-mono text-[10px]" style={{ color: 'var(--on-surface-variant)' }}>{label}</p>
                    <p className="font-mono text-xs" style={{ color: 'var(--on-surface)' }}>{val}</p>
                    {sub && <p className="font-mono text-[10px]" style={{ color: 'var(--on-surface-variant)' }}>{sub}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: 'var(--on-surface-variant)' }}>PASSENGER DETAILS</p>
              <div className="space-y-2">
                {result.passengers.map((p, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-4 px-3 py-2 rounded"
                    style={{ background: 'var(--surface-container-high)' }}>
                    <Users size={13} style={{ color: 'var(--on-surface-variant)' }} />
                    <span className="font-mono text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{p.name}</span>
                    <span className="font-mono text-xs" style={{ color: 'var(--on-surface-variant)' }}>Age {p.age} / {p.sex}</span>
                    <span className="font-mono text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                      Berth: <span style={{ color: 'var(--primary-container)' }}>{p.berth}</span>
                    </span>
                    <StatusChip status={p.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {result?.error && (
        <div className="glass rounded p-4 animate-fade-up" style={{ border: '1px solid rgba(255,180,171,0.3)' }}>
          <p className="font-mono text-sm" style={{ color: 'var(--error)' }}>⚠ {result.error}</p>
        </div>
      )}
    </div>
  );
}
