import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#1a7f37', dark: '#14622b' },
      },
    },
  },
  plugins: [],
} satisfies Config;
