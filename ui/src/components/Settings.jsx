import { useState, useEffect } from 'react';
import { Lock, User, Plus, Trash2 } from 'lucide-react';
import { fetchSettings, saveSettings, fetchPassengers, addPassenger, deletePassenger } from '../api';

function Toggle({ on, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="relative flex-shrink-0 w-10 h-5 rounded-full transition-colors duration-200"
      style={{ background: on ? 'var(--primary-container)' : 'var(--surface-container-highest)' }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200"
        style={{
          left: on ? '22px' : '2px',
          background: on ? 'var(--on-primary)' : 'var(--on-surface-variant)',
        }}
      />
    </button>
  );
}

export default function Settings() {
  const [creds, setCreds]         = useState({ irctc_username: '', irctc_password: '' });
  const [notifs, setNotifs]       = useState({ email_alerts: false, sms_gateway: false, push_sync: false });
  const [passengers, setPassengers] = useState([]);
  const [saving, setSaving]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState('');
  const [showAddP, setShowAddP]   = useState(false);
  const [newP, setNewP]           = useState({ name: '', age: '', id_type: 'Aadhaar', id_number: '' });
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([fetchSettings(), fetchPassengers()])
      .then(([s, ps]) => {
        setCreds({ irctc_username: s.irctc_username || '', irctc_password: '' });
        setNotifs({ email_alerts: s.email_alerts, sms_gateway: s.sms_gateway, push_sync: s.push_sync });
        setPassengers(ps);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleNotif = key => setNotifs(n => ({ ...n, [key]: !n[key] }));

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const body = {
        irctc_username: creds.irctc_username,
        email_alerts: notifs.email_alerts,
        sms_gateway: notifs.sms_gateway,
        push_sync: notifs.push_sync,
      };
      if (creds.irctc_password) body.irctc_password = creds.irctc_password;
      await saveSettings(body);
      setSaveMsg('Settings saved.');
      setCreds(c => ({ ...c, irctc_password: '' }));
    } catch (e) {
      setSaveMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPassenger = async () => {
    if (!newP.name || !newP.age || !newP.id_number) return;
    try {
      const created = await addPassenger({ name: newP.name, age: parseInt(newP.age), id_type: newP.id_type, id_number: newP.id_number });
      setPassengers(ps => [...ps, created]);
      setNewP({ name: '', age: '', id_type: 'Aadhaar', id_number: '' });
      setShowAddP(false);
    } catch {}
  };

  const handleDeletePassenger = async (id) => {
    try {
      await deletePassenger(id);
      setPassengers(ps => ps.filter(p => p.id !== id));
    } catch {}
  };

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Breadcrumb + heading */}
      <div>
        <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: 'var(--on-surface-variant)' }}>
          CONFIGURATION / SYSTEM_PARAMETERS
        </p>
        <h1 className="font-mono text-2xl font-bold" style={{ color: 'var(--on-surface)' }}>OPERATOR SETTINGS</h1>
      </div>

      {/* IRCTC Credentials */}
      <div className="glass rounded p-5 space-y-4">
        <p className="font-mono text-[10px] tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>IRCTC CREDENTIALS</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-mono text-[10px] tracking-widest mb-1 block" style={{ color: 'var(--on-surface-variant)' }}>USERNAME</label>
            <div className="flex items-center rounded" style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', overflow: 'hidden' }}>
              <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', paddingLeft: 12, paddingRight: 6 }}>
                <User size={13} style={{ color: 'var(--on-surface-variant)' }} />
              </span>
              <input
                value={loading ? '' : creds.irctc_username}
                onChange={e => setCreds(c => ({ ...c, irctc_username: e.target.value }))}
                placeholder={loading ? 'Loading...' : 'IRCTC username'}
                className="font-mono text-sm"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--on-surface)', padding: '8px 12px 8px 0' }}
              />
            </div>
          </div>
          <div>
            <label className="font-mono text-[10px] tracking-widest mb-1 block" style={{ color: 'var(--on-surface-variant)' }}>
              NEW PASSWORD <span style={{ color: 'var(--on-surface-variant)', fontWeight: 'normal' }}>(leave blank to keep)</span>
            </label>
            <div className="flex items-center rounded" style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', overflow: 'hidden' }}>
              <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', paddingLeft: 12, paddingRight: 6 }}>
                <Lock size={13} style={{ color: 'var(--on-surface-variant)' }} />
              </span>
              <input
                type="password"
                value={creds.irctc_password}
                onChange={e => setCreds(c => ({ ...c, irctc_password: e.target.value }))}
                placeholder="Enter new password"
                className="font-mono text-sm"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--on-surface)', padding: '8px 12px 8px 0' }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded font-mono text-xs font-bold tracking-wide transition-all hover:scale-105 disabled:opacity-50"
            style={{ background: 'var(--primary-container)', color: 'var(--on-primary)' }}
          >
            {saving ? 'SAVING...' : 'SAVE SETTINGS'}
          </button>
          {saveMsg && (
            <span className="font-mono text-[10px]" style={{ color: saveMsg.startsWith('Error') ? '#ffb4ab' : 'var(--primary-container)' }}>
              {saveMsg}
            </span>
          )}
        </div>
      </div>

      {/* System Notifications */}
      <div className="glass rounded p-5 space-y-4">
        <p className="font-mono text-[10px] tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>SYSTEM NOTIFICATIONS</p>

        {[
          { key: 'email_alerts', label: 'EMAIL_ALERTS',  desc: 'Notify on booking status changes' },
          { key: 'sms_gateway',  label: 'SMS_GATEWAY',   desc: 'Watch train schedule changes' },
          { key: 'push_sync',    label: 'PUSH_SYNC',     desc: 'Real-time booking status shifts' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-1">
            <div>
              <p className="font-mono text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{label}</p>
              <p className="font-mono text-[10px]" style={{ color: 'var(--on-surface-variant)' }}>{desc}</p>
            </div>
            <Toggle on={notifs[key]} onToggle={() => toggleNotif(key)} />
          </div>
        ))}
      </div>

      {/* Master Passenger List */}
      <div className="glass rounded overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--outline-variant)', background: 'rgba(0,0,0,0.2)' }}>
          <div>
            <p className="font-mono text-[10px] tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>MASTER PASSENGER LIST</p>
            <p className="font-mono text-[9px]" style={{ color: 'var(--on-surface-variant)' }}>{passengers.length} RECORDS FOUND</p>
          </div>
          <button
            onClick={() => setShowAddP(p => !p)}
            className="flex items-center gap-1 px-3 py-1.5 rounded font-mono text-[10px] font-bold tracking-wide"
            style={{ background: 'var(--primary-container)', color: 'var(--on-primary)' }}
          >
            <Plus size={11} />
            ADD_NEW_ENTITY
          </button>
        </div>

        {/* Add passenger form */}
        {showAddP && (
          <div className="px-5 py-4 border-b space-y-3" style={{ borderColor: 'var(--outline-variant)', background: 'rgba(0,0,0,0.1)' }}>
            <p className="font-mono text-[10px] tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>NEW ENTITY</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { placeholder: 'Full name', key: 'name' },
                { placeholder: 'Age', key: 'age', type: 'number' },
              ].map(({ placeholder, key, type }) => (
                <input
                  key={key}
                  placeholder={placeholder}
                  type={type || 'text'}
                  value={newP[key]}
                  onChange={e => setNewP(p => ({ ...p, [key]: e.target.value }))}
                  className="font-mono text-xs rounded"
                  style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)', padding: '6px 10px' }}
                />
              ))}
              <select
                value={newP.id_type}
                onChange={e => setNewP(p => ({ ...p, id_type: e.target.value }))}
                className="font-mono text-xs rounded"
                style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)', padding: '6px 10px' }}
              >
                {['Aadhaar', 'PAN', 'Passport', 'VoterID'].map(t => <option key={t}>{t}</option>)}
              </select>
              <input
                placeholder="ID number"
                value={newP.id_number}
                onChange={e => setNewP(p => ({ ...p, id_number: e.target.value }))}
                className="font-mono text-xs rounded"
                style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)', padding: '6px 10px' }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddPassenger}
                className="px-3 py-1.5 rounded font-mono text-[10px] font-bold"
                style={{ background: 'var(--primary-container)', color: 'var(--on-primary)' }}
              >
                SAVE ENTITY
              </button>
              <button
                onClick={() => setShowAddP(false)}
                className="px-3 py-1.5 rounded font-mono text-[10px]"
                style={{ background: 'transparent', color: 'var(--on-surface-variant)', border: '1px solid var(--outline-variant)' }}
              >
                CANCEL
              </button>
            </div>
          </div>
        )}

        {/* Table header */}
        <div
          className="grid font-mono text-[9px] tracking-widest px-5 py-2 border-b"
          style={{
            gridTemplateColumns: '60px 1fr 50px 1fr 1fr 60px',
            borderColor: 'var(--outline-variant)',
            color: 'var(--on-surface-variant)',
            background: 'rgba(0,0,0,0.15)',
          }}
        >
          <span>ID</span>
          <span>NAME</span>
          <span>AGE</span>
          <span>ID TYPE</span>
          <span>ID NUMBER</span>
          <span>ACTIONS</span>
        </div>

        {/* Rows */}
        <div className="divide-y" style={{ borderColor: 'var(--outline-variant)' }}>
          {loading && (
            <div className="px-5 py-6 text-center">
              <p className="font-mono text-xs animate-blink" style={{ color: 'var(--on-surface-variant)' }}>LOADING...</p>
            </div>
          )}
          {!loading && passengers.length === 0 && (
            <div className="px-5 py-6 text-center">
              <p className="font-mono text-xs" style={{ color: 'var(--on-surface-variant)' }}>No passengers saved yet.</p>
            </div>
          )}
          {passengers.map(p => (
            <div
              key={p.id}
              className="grid items-center px-5 py-3 hover:bg-white/[0.02] transition-colors"
              style={{ gridTemplateColumns: '60px 1fr 50px 1fr 1fr 60px' }}
            >
              <span className="font-mono text-[10px]" style={{ color: 'var(--primary-container)' }}>#{p.id}</span>
              <span className="font-mono text-xs font-bold" style={{ color: 'var(--on-surface)' }}>{p.name}</span>
              <span className="font-mono text-xs" style={{ color: 'var(--on-surface-variant)' }}>{p.age}</span>
              <span className="font-mono text-xs" style={{ color: 'var(--on-surface-variant)' }}>{p.id_type}</span>
              <span className="font-mono text-xs" style={{ color: 'var(--on-surface-variant)' }}>{p.id_number}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeletePassenger(p.id)}
                  style={{ color: '#ffb4ab' }}
                  className="hover:opacity-80 transition-opacity"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
