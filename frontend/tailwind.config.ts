import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#1a7f37',
          dark: '#14622b',
          light: '#e8f3ec',
          50: '#f0f8f3',
        },
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
