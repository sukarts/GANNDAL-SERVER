import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  // Dark mode piloté par l'attribut data-theme='dark' sur <html>
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Marque : hex statique (compatible modificateurs d'opacité type bg-brand/10)
        brand: {
          DEFAULT: '#1a7f37',
          dark: '#14622b',
          light: '#e8f3ec',
          50: '#f0f8f3',
        },
        // Tokens de surface/texte (thémés light/dark)
        bg: 'var(--bg)',
        surface: { DEFAULT: 'var(--surface)', 2: 'var(--surface-2)' },
        content: 'var(--text)',
        muted: 'var(--muted)',
        line: 'var(--border)',
        // Sémantiques
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        info: 'var(--info)',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(16 24 40 / 0.05)',
        card: '0 1px 3px 0 rgb(16 24 40 / 0.06), 0 1px 2px -1px rgb(16 24 40 / 0.04)',
      },
      borderRadius: {
        xl: '0.875rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
