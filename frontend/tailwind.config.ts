import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-container': 'rgb(var(--surface-container) / <alpha-value>)',
        'surface-high': 'rgb(var(--surface-high) / <alpha-value>)',
        'outline-variant': 'rgb(var(--outline-variant) / <alpha-value>)',
        'on-surface': 'rgb(var(--on-surface) / <alpha-value>)',
        'on-surface-variant': 'rgb(var(--on-surface-variant) / <alpha-value>)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        'primary-container': 'rgb(var(--primary-container) / <alpha-value>)',
        'status-green': 'rgb(var(--status-green) / <alpha-value>)',
        'status-amber': 'rgb(var(--status-amber) / <alpha-value>)',
        'status-red': 'rgb(var(--status-red) / <alpha-value>)',
        'status-gray': 'rgb(var(--status-gray) / <alpha-value>)',
        'status-purple': 'rgb(var(--status-purple) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '2px',
        md: '4px',
        lg: '8px',
      },
    },
  },
  plugins: [],
} satisfies Config
