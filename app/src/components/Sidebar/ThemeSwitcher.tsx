import { useTheme } from '../../hooks/useTheme';

const THEME_ICONS: Record<string, string> = {
  light: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`,
  dark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  terminal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,
  ide: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
};

export function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 4,
      }}
    >
      {themes.map((t) => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          title={t.label}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            padding: '6px 4px',
            border: `1px solid ${theme === t.value ? 'var(--accent)' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius)',
            background: theme === t.value ? 'var(--bg-active)' : 'var(--bg-tertiary)',
            cursor: 'pointer',
            transition: 'all var(--transition)',
            color: theme === t.value ? 'var(--accent)' : 'var(--text-secondary)',
          }}
          onMouseEnter={(e) => {
            if (theme !== t.value) {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (theme !== t.value) {
              e.currentTarget.style.background = 'var(--bg-tertiary)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }
          }}
        >
          <span dangerouslySetInnerHTML={{ __html: THEME_ICONS[t.icon] || '' }} />
          <span style={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}
