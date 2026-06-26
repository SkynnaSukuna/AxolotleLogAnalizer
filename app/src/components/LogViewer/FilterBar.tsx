/**
 * Filter bar with quick-toggle level chips and debounced search input.
 *
 * Chips:  All  |  INFO  |  WARN  |  ERROR
 */

import type { BlockType } from '../../types/logTypes';

interface FilterBarProps {
  activeFilter: BlockType | null;
  onFilterChange: (filter: BlockType | null) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

const CHIPS: { label: string; value: BlockType | null }[] = [
  { label: 'All', value: null },
  { label: 'INFO', value: 'info' },
  { label: 'WARN', value: 'warn' },
  { label: 'ERROR', value: 'error' },
];

export function FilterBar({
  activeFilter,
  onFilterChange,
  searchValue,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '6px 12px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        {CHIPS.map(({ label, value }) => {
          const active = activeFilter === value;
          return (
            <button
              key={label}
              onClick={() => onFilterChange(value)}
              style={{
                padding: '3px 10px',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border-color)'}`,
                borderRadius: '14px',
                background: active ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: active ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.73rem',
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 120ms ease',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <svg
          style={{
            position: 'absolute',
            left: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            width: 14,
            height: 14,
            pointerEvents: 'none',
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search in log lines…"
          spellCheck={false}
          style={{
            width: '100%',
            padding: '4px 10px 4px 28px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius)',
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            fontSize: '0.8125rem',
            outline: 'none',
            fontFamily: 'var(--font-sans)',
          }}
        />
      </div>
    </div>
  );
}
