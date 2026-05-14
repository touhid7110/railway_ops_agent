import { useState, useEffect } from 'react';
import { Search, ArrowRight, Calendar, Trash2, Lock, User, Check } from 'lucide-react';
import { createJob, fetchPassengers, addPassenger as apiAddPassenger } from '../api';

const QUOTA_OPTIONS = ['GENERAL', 'TATKAL', 'PREMIUM_TATKAL'];
const CLASS_OPTIONS = ['1A', '2A', '3A', 'SL', 'CC', 'EC'];
const ID_TYPES = ['Aadhaar', 'PAN', 'Passport', 'VoterID'];

const inputWrap = {
  display: 'flex',
  alignItems: 'center',
  borderRadius: 4,
  background: 'var(--surface-container-high)',
  border: '1px solid var(--outline-variant)',
  overflow: 'hidden',
};
const iconSlot = {
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  paddingLeft: 12,
  paddingRight: 6,
};
const inputBase = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  fontFamily: 'inherit',
  fontSize: '0.875rem',
  color: 'var(--on-surface)',
  padding: '8px 12px 8px 0',
};

function Field({ label, children }) {
  return (
    <div>
      <label className="font-mono text-[10px] tracking-widest mb-1 block" style={{ color: 'var(--on-surface-variant)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function BookingSearch({ onNavigate, setActiveJobId }) {
  const [form, setForm] = useState({
    source: '',
    destination: '',
    date: '',
    travel_class: '3A',
    booking_type: 'GENERAL',
    irctc_username: '',
    irctc_password: '',
    contact_mobile: '',
    notify_email: '',
  });
  const [passengers, setPassengers] = useState([]);
  const [newP, setNewP] = useState({ name: '', age: '', id_type: 'Aadhaar', id_number: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Task 1.1 — saved passengers from API
  const [savedPassengers, setSavedPassengers] = useState([]);
  // Task 1.2 — track which saved passenger IDs are in the active roster
  const [selectedSavedIds, setSelectedSavedIds] = useState(new Set());
  // Task 2.1 — tab state
  const [rosterTab, setRosterTab] = useState('roster');
  // Task 4.1 — save-to-roster toggle
  const [saveToRoster, setSaveToRoster] = useState(false);
  const [rosterSaveError, setRosterSaveError] = useState('');

  // Task 1.1 — fetch on mount, silently ignore errors
  useEffect(() => {
    fetchPassengers().then(setSavedPassengers).catch(() => {});
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const swap = () => setForm(f => ({ ...f, source: f.destination, destination: f.source }));

  // Task 3.2 — toggle a saved passenger in/out of the active roster
  const toggleSavedPassenger = (p) => {
    if (selectedSavedIds.has(p.id)) {
      setPassengers(ps => ps.filter(r => r.id_number !== p.id_number));
      setSelectedSavedIds(ids => { const next = new Set(ids); next.delete(p.id); return next; });
    } else {
      // Task 3.2 dedup: skip if id_number already in active roster
      if (!passengers.some(r => r.id_number === p.id_number)) {
        setPassengers(ps => [...ps, { name: p.name, age: p.age, id_type: p.id_type, id_number: p.id_number }]);
      }
      setSelectedSavedIds(ids => { const next = new Set(ids); next.add(p.id); return next; });
    }
  };

  // Tasks 4.3–4.5 — add passenger (with optional API save)
  const handleAddPassenger = async () => {
    if (!newP.name || !newP.age || !newP.id_number) return;
    const pData = { name: newP.name, age: parseInt(newP.age), id_type: newP.id_type, id_number: newP.id_number };
    setRosterSaveError('');

    if (saveToRoster) {
      try {
        const saved = await apiAddPassenger(pData);
        setSavedPassengers(ps => [...ps, saved]);
        setSelectedSavedIds(ids => { const next = new Set(ids); next.add(saved.id); return next; });
        setPassengers(ps => [...ps, pData]);
      } catch {
        setRosterSaveError('Failed to save to roster — added for this session only.');
        setPassengers(ps => [...ps, pData]);
      }
    } else {
      // Task 4.4 — ephemeral only
      setPassengers(ps => [...ps, pData]);
    }

    // Task 4.5 — reset form
    setNewP({ name: '', age: '', id_type: 'Aadhaar', id_number: '' });
    setSaveToRoster(false);
  };

  // Task 5.2 — remove passenger and clear selectedSavedIds if applicable
  const removePassenger = (i) => {
    const p = passengers[i];
    const savedMatch = savedPassengers.find(s => s.id_number === p.id_number);
    if (savedMatch) {
      setSelectedSavedIds(ids => { const next = new Set(ids); next.delete(savedMatch.id); return next; });
    }
    setPassengers(ps => ps.filter((_, j) => j !== i));
  };

  const launch = async () => {
    if (!form.source || !form.destination || !form.date) {
      setError('Source, destination, and date are required.');
      return;
    }
    if (!form.irctc_username || !form.irctc_password) {
      setError('IRCTC credentials are required.');
      return;
    }
    if (passengers.length === 0) {
      setError('Add at least one passenger.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await createJob({
        source: form.source,
        destination: form.destination,
        date: form.date,
        travel_class: form.travel_class,
        booking_type: form.booking_type,
        passengers,
        contact_mobile: form.contact_mobile,
        notify_email: form.notify_email,
        irctc_username: form.irctc_username,
        irctc_password: form.irctc_password,
      });
      setActiveJobId(result.job_id);
      onNavigate('logs');
    } catch (e) {
      setError(e.message || 'Failed to launch agent.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Heading */}
      <div>
        <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: 'var(--primary-container)' }}>
          // BOOKING TERMINAL
        </p>
        <h1 className="font-mono text-2xl font-bold" style={{ color: 'var(--on-surface)' }}>INITIALIZE_BOOKING</h1>
        <p className="font-mono text-[10px] mt-1" style={{ color: 'var(--on-surface-variant)' }}>
          OPERATIONAL PARAMETERS FOR MISSION: #MX-{Math.floor(Math.random() * 9000 + 1000)}
        </p>
      </div>

      {error && (
        <div className="rounded px-4 py-3 font-mono text-xs" style={{ background: 'rgba(255,180,171,0.08)', border: '1px solid rgba(255,180,171,0.3)', color: '#ffb4ab' }}>
          {error}
        </div>
      )}

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── LEFT: JOURNEY_PARAMETERS ── */}
        <div className="glass hud-border rounded p-5 space-y-4 flex flex-col">
          <p className="font-mono text-[10px] tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
            JOURNEY_PARAMETERS
          </p>

          {/* FROM */}
          <Field label="FROM_STATION">
            <div style={inputWrap}>
              <span style={{ ...iconSlot, color: 'var(--primary-container)', fontFamily: 'inherit', fontSize: '0.875rem' }}>&gt;</span>
              <input
                value={form.source}
                onChange={e => set('source', e.target.value)}
                placeholder="e.g. NDLS"
                style={inputBase}
                className="font-mono"
              />
            </div>
          </Field>

          {/* TO */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-mono text-[10px] tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
                TO_STATION
              </label>
              <button
                onClick={swap}
                className="w-6 h-6 rounded flex items-center justify-center text-xs"
                style={{ color: 'var(--primary-container)', background: 'rgba(0,242,255,0.1)' }}
                title="Swap stations"
              >⇄</button>
            </div>
            <div style={inputWrap}>
              <span style={iconSlot}>
                <Search size={13} style={{ color: 'var(--on-surface-variant)' }} />
              </span>
              <input
                value={form.destination}
                onChange={e => set('destination', e.target.value)}
                placeholder="Search destination..."
                style={inputBase}
                className="font-mono"
              />
            </div>
          </div>

          {/* DATE */}
          <Field label="DATE">
            <div style={inputWrap}>
              <span style={iconSlot}>
                <Calendar size={13} style={{ color: 'var(--on-surface-variant)' }} />
              </span>
              <input
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                style={{ ...inputBase, colorScheme: 'dark' }}
                className="font-mono"
              />
            </div>
          </Field>

          {/* CLASS */}
          <Field label="CLASS">
            <select
              value={form.travel_class}
              onChange={e => set('travel_class', e.target.value)}
              className="w-full font-mono text-sm rounded"
              style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)', padding: '8px 12px' }}
            >
              {CLASS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>

          {/* QUOTA pills */}
          <div>
            <label className="font-mono text-[10px] tracking-widest mb-2 block" style={{ color: 'var(--on-surface-variant)' }}>
              QUOTA
            </label>
            <div className="flex gap-2 flex-wrap">
              {QUOTA_OPTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => set('booking_type', q)}
                  className="font-mono text-[10px] tracking-wide font-bold transition-all"
                  style={{
                    padding: '6px 12px',
                    borderRadius: 4,
                    background: form.booking_type === q ? 'rgba(0,242,255,0.15)' : 'var(--surface-container-high)',
                    color: form.booking_type === q ? 'var(--primary-container)' : 'var(--on-surface-variant)',
                    border: `1px solid ${form.booking_type === q ? 'rgba(0,242,255,0.4)' : 'var(--outline-variant)'}`,
                  }}
                >
                  [ {q} ]
                </button>
              ))}
            </div>
          </div>

          {/* IRCTC Credentials */}
          <div className="border-t pt-4 space-y-3" style={{ borderColor: 'var(--outline-variant)' }}>
            <p className="font-mono text-[10px] tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>IRCTC_CREDENTIALS</p>
            <Field label="USERNAME">
              <div style={inputWrap}>
                <span style={iconSlot}><User size={13} style={{ color: 'var(--on-surface-variant)' }} /></span>
                <input
                  value={form.irctc_username}
                  onChange={e => set('irctc_username', e.target.value)}
                  placeholder="IRCTC username"
                  style={inputBase}
                  className="font-mono"
                />
              </div>
            </Field>
            <Field label="PASSWORD">
              <div style={inputWrap}>
                <span style={iconSlot}><Lock size={13} style={{ color: 'var(--on-surface-variant)' }} /></span>
                <input
                  type="password"
                  value={form.irctc_password}
                  onChange={e => set('irctc_password', e.target.value)}
                  placeholder="IRCTC password"
                  style={inputBase}
                  className="font-mono"
                />
              </div>
            </Field>
          </div>
        </div>

        {/* ── RIGHT: PERSONNEL_ROSTER ── */}
        <div className="glass hud-border rounded p-5 flex flex-col gap-4">
          <p className="font-mono text-[10px] tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
            PERSONNEL_ROSTER
          </p>

          {/* Task 2.2 — tab pills */}
          <div className="flex gap-2">
            {[
              { id: 'roster', label: '[ FROM ROSTER ]' },
              { id: 'add', label: '[ ADD NEW ]' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setRosterTab(tab.id)}
                className="font-mono text-[10px] tracking-wide font-bold transition-all"
                style={{
                  padding: '6px 12px',
                  borderRadius: 4,
                  background: rosterTab === tab.id ? 'rgba(0,242,255,0.15)' : 'var(--surface-container-high)',
                  color: rosterTab === tab.id ? 'var(--primary-container)' : 'var(--on-surface-variant)',
                  border: `1px solid ${rosterTab === tab.id ? 'rgba(0,242,255,0.4)' : 'var(--outline-variant)'}`,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Task 2.3 — FROM ROSTER tab */}
          {rosterTab === 'roster' && (
            <div className="space-y-2">
              {savedPassengers.length === 0 ? (
                /* Task 3.3 — empty state */
                <p className="font-mono text-[10px]" style={{ color: 'var(--on-surface-variant)' }}>
                  No saved passengers yet — add one below or in Settings.
                </p>
              ) : (
                savedPassengers.map(p => {
                  const isSelected = selectedSavedIds.has(p.id);
                  return (
                    /* Task 3.1 — clickable row with teal highlight + checkmark */
                    <button
                      key={p.id}
                      onClick={() => toggleSavedPassenger(p)}
                      className="w-full flex items-center gap-3 rounded text-left transition-all"
                      style={{
                        background: isSelected ? 'rgba(0,242,255,0.08)' : 'var(--surface-container-high)',
                        border: `1px solid ${isSelected ? 'rgba(0,242,255,0.4)' : 'var(--outline-variant)'}`,
                        borderLeft: isSelected ? '3px solid var(--primary-container)' : undefined,
                        padding: '10px 12px',
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{p.name}</p>
                        <p className="font-mono text-[10px]" style={{ color: 'var(--on-surface-variant)' }}>
                          Age {p.age} · {p.id_type}: {p.id_number}
                        </p>
                      </div>
                      {isSelected && <Check size={12} style={{ color: 'var(--primary-container)', flexShrink: 0 }} />}
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Task 2.4 — ADD NEW tab */}
          {rosterTab === 'add' && (
            <div className="rounded p-3 space-y-2" style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)' }}>
              <p className="font-mono text-[10px] tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>NEW PASSENGER</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Full name"
                  value={newP.name}
                  onChange={e => setNewP(p => ({ ...p, name: e.target.value }))}
                  className="font-mono text-xs rounded"
                  style={{ background: 'var(--surface-container)', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)', padding: '6px 10px' }}
                />
                <input
                  placeholder="Age"
                  type="number"
                  value={newP.age}
                  onChange={e => setNewP(p => ({ ...p, age: e.target.value }))}
                  className="font-mono text-xs rounded"
                  style={{ background: 'var(--surface-container)', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)', padding: '6px 10px' }}
                />
                <select
                  value={newP.id_type}
                  onChange={e => setNewP(p => ({ ...p, id_type: e.target.value }))}
                  className="font-mono text-xs rounded"
                  style={{ background: 'var(--surface-container)', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)', padding: '6px 10px' }}
                >
                  {ID_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <input
                  placeholder="ID number"
                  value={newP.id_number}
                  onChange={e => setNewP(p => ({ ...p, id_number: e.target.value }))}
                  className="font-mono text-xs rounded"
                  style={{ background: 'var(--surface-container)', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)', padding: '6px 10px' }}
                />
              </div>
              {/* Task 4.2 — Save to roster checkbox */}
              <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--on-surface-variant)' }}>
                <input
                  type="checkbox"
                  checked={saveToRoster}
                  onChange={e => setSaveToRoster(e.target.checked)}
                  style={{ accentColor: 'var(--primary-container)' }}
                />
                <span className="font-mono text-[10px]">Save to roster</span>
              </label>
              {rosterSaveError && (
                <p className="font-mono text-[10px]" style={{ color: '#ffb4ab' }}>{rosterSaveError}</p>
              )}
              <button
                onClick={handleAddPassenger}
                className="px-3 py-1 rounded font-mono text-[10px] font-bold"
                style={{ background: 'var(--primary-container)', color: 'var(--on-primary)' }}
              >
                ADD
              </button>
            </div>
          )}

          {/* Task 5.1 — Active roster always visible below tabs */}
          {passengers.length > 0 && (
            <div className="space-y-2">
              <p className="font-mono text-[10px] tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
                ACTIVE_ROSTER
              </p>
              {passengers.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded"
                  style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', padding: '10px 12px' }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold flex-shrink-0"
                    style={{ background: 'rgba(0,242,255,0.1)', color: 'var(--primary-container)' }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{p.name}</p>
                    <p className="font-mono text-[10px]" style={{ color: 'var(--on-surface-variant)' }}>
                      Age {p.age} · {p.id_type}: {p.id_number}
                    </p>
                  </div>
                  <button onClick={() => removePassenger(i)} style={{ color: '#ffb4ab' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Communication channels */}
          <div className="border-t" style={{ borderColor: 'var(--outline-variant)', paddingTop: 12 }}>
            <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: 'var(--on-surface-variant)' }}>
              COMMUNICATION_CHANNELS
            </p>
            <div className="space-y-2">
              <Field label="NOTIFY_EMAIL">
                <div style={inputWrap}>
                  <span style={{ ...iconSlot, color: 'var(--primary-container)', fontFamily: 'inherit', fontSize: '0.875rem' }}>&gt;</span>
                  <input
                    type="email"
                    value={form.notify_email}
                    onChange={e => set('notify_email', e.target.value)}
                    placeholder="email@example.com"
                    style={inputBase}
                    className="font-mono"
                  />
                </div>
              </Field>
              <Field label="CONTACT_MOBILE">
                <div style={inputWrap}>
                  <span style={{ ...iconSlot, color: 'var(--primary-container)', fontFamily: 'inherit', fontSize: '0.875rem' }}>&gt;</span>
                  <input
                    type="tel"
                    value={form.contact_mobile}
                    onChange={e => set('contact_mobile', e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    style={inputBase}
                    className="font-mono"
                  />
                </div>
              </Field>
            </div>
          </div>

          {/* Footer: CTA */}
          <div className="mt-auto border-t flex justify-end" style={{ borderColor: 'var(--outline-variant)', paddingTop: 16 }}>
            <button
              onClick={launch}
              disabled={loading}
              className="flex items-center gap-2 font-mono text-sm font-bold tracking-wide glow-teal transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--primary-container)', color: 'var(--on-primary)', padding: '10px 24px', borderRadius: 4 }}
            >
              {loading ? 'LAUNCHING...' : <>LAUNCH AGENT <ArrowRight size={15} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
