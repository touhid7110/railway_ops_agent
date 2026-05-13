export default function StatusChip({ status }) {
  const map = {
    AVAILABLE:   { label: 'AVAILABLE',   cls: 'chip-available' },
    SUCCESS:     { label: 'SUCCESS',     cls: 'chip-available' },
    WAITING:     { label: 'WAITING',     cls: 'chip-waiting' },
    IN_PROGRESS: { label: 'IN_PROGRESS', cls: 'chip-running' },
    REGRET:      { label: 'REGRET',      cls: 'chip-regret' },
    RUNNING:     { label: 'RUNNING',     cls: 'chip-running' },
    WL:          { label: 'W/L',         cls: 'chip-waiting' },
    RAC:         { label: 'RAC',         cls: 'chip-waiting' },
    // backend statuses
    success:     { label: 'SUCCESS',     cls: 'chip-available' },
    running:     { label: 'RUNNING',     cls: 'chip-running' },
    queued:      { label: 'QUEUED',      cls: 'chip-waiting' },
    waiting_otp: { label: 'WAITING OTP', cls: 'chip-waiting' },
    failed:      { label: 'FAILED',      cls: 'chip-regret' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'chip-waiting' };

  return (
    <span
      className={`${cls} font-mono text-[9px] tracking-widest px-1.5 py-0.5 rounded-sm`}
    >
      [ {label} ]
    </span>
  );
}
