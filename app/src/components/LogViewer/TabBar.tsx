/**
 * Tab navigation:  All Messages  |  Errors  |  Warnings
 *
 * Each tab shows a count badge next to its label.
 */

import type { TabType } from '../../types/logTypes';

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  counts: Record<TabType, number>;
}

const TABS: { key: TabType; label: string }[] = [
  { key: 'all', label: 'All Messages' },
  { key: 'errors', label: 'Errors' },
  { key: 'warnings', label: 'Warnings' },
];

export function TabBar({ activeTab, onTabChange, counts }: TabBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '2px',
        padding: '0 12px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        flexShrink: 0,
      }}
    >
      {TABS.map(({ key, label }) => {
        const active = activeTab === key;
        const count = counts[key];
        return (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            style={{
              padding: '7px 14px',
              border: 'none',
              background: 'transparent',
              color: active ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '0.8125rem',
              fontWeight: active ? 600 : 400,
              cursor: 'pointer',
              borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 120ms ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {label}
            {count > 0 && (
              <span
                style={{
                  padding: '0 6px',
                  borderRadius: '10px',
                  fontSize: '0.68rem',
                  lineHeight: '18px',
                  background: active ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: active ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 500,
                  minWidth: 20,
                  textAlign: 'center',
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
