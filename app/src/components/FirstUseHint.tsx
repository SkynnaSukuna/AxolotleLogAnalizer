import { useState } from 'react';

interface FirstUseHintProps {
  storageKey: string;
  message: string;
  icon?: string;
  delay?: number;
}

export function FirstUseHint({ storageKey, message, icon = '💡', delay = 0 }: FirstUseHintProps) {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(storageKey) === 'true');
  const [visible, setVisible] = useState(delay === 0);

  if (dismissed) return null;

  setTimeout(() => setVisible(true), delay);

  if (!visible) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderRadius: 'var(--radius)',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        marginBottom: 8,
        animation: 'fadeIn 300ms ease',
      }}
    >
      <span style={{ fontSize: '1rem' }}>{icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        className="btn btn-sm btn-icon"
        onClick={() => {
          localStorage.setItem(storageKey, 'true');
          setDismissed(true);
        }}
        title="Закрыть"
      >
        ×
      </button>
    </div>
  );
}
