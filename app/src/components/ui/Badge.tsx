import type { LogStatus } from '../../types';

const STATUS_CONFIG: Record<LogStatus, { label: string; className: string }> = {
  new: { label: 'Новый', className: 'badge-new' },
  in_progress: { label: 'В работе', className: 'badge-in-progress' },
  resolved: { label: 'Решено', className: 'badge-resolved' },
  archived: { label: 'Архив', className: 'badge-archived' },
};

interface BadgeProps {
  status: LogStatus;
  onClick?: () => void;
}

export function Badge({ status, onClick }: BadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`badge ${config.className}${onClick ? ' cursor-pointer' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
    >
      {status === 'resolved' && <span className="badge-icon">✓</span>}
      {config.label}
    </span>
  );
}
