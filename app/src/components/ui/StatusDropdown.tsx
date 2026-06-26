import { useEffect, useRef } from 'react';
import type { LogStatus } from '../../types';

const STATUS_OPTIONS: Record<LogStatus, { label: string; color: string; bg: string }> = {
  new: { label: 'Новый', color: '#2563eb', bg: '#dbeafe' },
  in_progress: { label: 'В работе', color: '#a16207', bg: '#fef9c3' },
  resolved: { label: 'Решено', color: '#15803d', bg: '#dcfce7' },
  archived: { label: 'Архив', color: '#6b7280', bg: '#f3f4f6' },
};

const STATUS_ORDER: LogStatus[] = ['new', 'in_progress', 'resolved', 'archived'];

interface StatusDropdownProps {
  current: LogStatus;
  onChange: (status: LogStatus) => void;
  onClose: () => void;
  style?: React.CSSProperties;
}

export function StatusDropdown({ current, onChange, onClose, style }: StatusDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 6,
        padding: 4,
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        whiteSpace: 'nowrap',
        zIndex: 10000,
        minWidth: 130,
        ...style,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {STATUS_ORDER.map((key) => {
        const s = STATUS_OPTIONS[key];
        return (
          <div
            key={key}
            onClick={() => {
              onChange(key);
              onClose();
            }}
            style={{
              padding: '5px 12px',
              borderRadius: 4,
              color: s.color,
              background: key === current ? s.bg : 'transparent',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: key === current ? 700 : 500,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {key === 'resolved' && <span style={{ fontSize: '0.7rem' }}>✓</span>}
            {key !== 'resolved' && <span style={{ width: 14 }} />}
            {s.label}
          </div>
        );
      })}
    </div>
  );
}
