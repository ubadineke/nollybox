import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0e',
        surface: '#14141c',
        surface2: '#1d1d27',
        line: 'rgba(255,255,255,0.08)',
        ink: '#f6f6f8',
        dim: '#9b9ba8',
        gold: {
          DEFAULT: '#f5b73d',
          soft: '#f7c869',
          deep: '#caa024',
        },
        rose: '#f4456b',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-sora)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 8px 40px -8px rgba(245,183,61,0.45)',
        card: '0 12px 30px -12px rgba(0,0,0,0.7)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'sheet-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s cubic-bezier(0.22,1,0.36,1) both',
        'sheet-up': 'sheet-up 0.32s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.25s ease both',
      },
    },
  },
  plugins: [],
};

export default config;
