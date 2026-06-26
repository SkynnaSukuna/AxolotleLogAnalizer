/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['data-theme', 'dark'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: 'var(--bg-sidebar)',
        primary: 'var(--bg-primary)',
        secondary: 'var(--bg-secondary)',
        tertiary: 'var(--bg-tertiary)',
        'bg-hover': 'var(--bg-hover)',
        'bg-active': 'var(--bg-active)',
        'bg-input': 'var(--bg-input)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        border: 'var(--border-color)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        danger: 'var(--danger)',
        success: 'var(--success)',
        warning: 'var(--warning)',
      },
      borderColor: {
        DEFAULT: 'var(--border-color)',
      },
      ringColor: {
        DEFAULT: 'var(--accent)',
      },
      fontFamily: {
        mono: ['Cascadia Code', 'Fira Code', 'JetBrains Mono', 'monospace'],
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      transitionDuration: {
        theme: '200ms',
      },
    },
  },
  plugins: [],
};
