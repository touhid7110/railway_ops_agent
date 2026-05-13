import { useState } from 'react';
import {
  LayoutDashboard, Plus, Bot, History,
  Settings, ChevronRight, Activity, Zap, LogOut, Shield
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { id: 'booking',   label: 'New Booking', icon: Plus },
  { id: 'logs',      label: 'Live Agent',  icon: Bot },
  { id: 'history',   label: 'History',     icon: History },
  { id: 'settings',  label: 'Settings',    icon: Settings },
];

export default function Sidebar({ active, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="relative flex flex-col h-full transition-all duration-300"
      style={{
        width: collapsed ? 64 : 240,
        background: 'var(--surface-container-low)',
        borderRight: '1px solid var(--outline-variant)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: 'var(--outline-variant)' }}>
        <div
          className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center glow-teal"
          style={{ background: 'var(--primary-container)' }}
        >
          <Zap size={16} color="#00363a" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="animate-slide-in overflow-hidden">
            <p className="font-mono text-xs font-bold" style={{ color: 'var(--primary-container)', letterSpacing: '0.08em' }}>
              OdysseyAI
            </p>
            <p className="font-mono text-[10px]" style={{ color: 'var(--on-surface-variant)', letterSpacing: '0.06em' }}>
              OPERATOR_01
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-1 px-2">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`w-full flex items-center gap-3 px-2 py-2.5 rounded text-sm transition-all duration-200 text-left nav-item ${active === id ? 'nav-active' : ''}`}
            style={{ color: active === id ? 'var(--primary-container)' : 'var(--on-surface-variant)' }}
            title={collapsed ? label : undefined}
          >
            <Icon size={17} strokeWidth={1.8} className="flex-shrink-0 ml-0.5" />
            {!collapsed && (
              <span className="font-mono text-xs tracking-wide truncate">{label}</span>
            )}
            {!collapsed && active === id && (
              <ChevronRight size={13} className="ml-auto" />
            )}
          </button>
        ))}
      </nav>

      {/* Status indicator */}
      {!collapsed && (
        <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--outline-variant)' }}>
          <div className="glass-teal rounded p-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full animate-status flex-shrink-0" style={{ background: '#00f2ff' }} />
              <span className="font-mono text-[10px] tracking-widest" style={{ color: '#00f2ff' }}>AGENT ONLINE</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity size={11} style={{ color: 'var(--on-surface-variant)' }} />
              <span className="font-mono text-[9px]" style={{ color: 'var(--on-surface-variant)' }}>3 tasks running</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom actions */}
      <div className="px-2 pb-3 space-y-1">
        <button
          className="w-full flex items-center gap-3 px-2 py-2 rounded nav-item text-sm"
          style={{ color: 'var(--on-surface-variant)' }}
          title={collapsed ? 'Support' : undefined}
        >
          <Shield size={16} strokeWidth={1.8} className="flex-shrink-0 ml-0.5" />
          {!collapsed && <span className="font-mono text-xs tracking-wide">Support</span>}
        </button>
        <button
          className="w-full flex items-center gap-3 px-2 py-2 rounded nav-item text-sm"
          style={{ color: '#ffb4ab' }}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut size={16} strokeWidth={1.8} className="flex-shrink-0 ml-0.5" />
          {!collapsed && <span className="font-mono text-xs tracking-wide">Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-6 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-200 hover:scale-110"
        style={{
          background: 'var(--surface-container-high)',
          border: '1px solid var(--outline-variant)',
          color: 'var(--on-surface-variant)'
        }}
      >
        {collapsed ? '›' : '‹'}
      </button>
    </aside>
  );
}
