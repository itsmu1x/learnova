import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-plex)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-syne)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        paper: {
          DEFAULT: '#F3F4F6',
          elev: '#FFFFFF',
          ink: '#0B0D12',
          mute: '#5C6578',
          line: '#D8DCE6',
        },
        signal: {
          DEFAULT: '#0057FF',
          soft: '#E8F0FF',
          deep: '#003FBB',
        },
        brand: {
          50: '#E8F0FF',
          100: '#D1E0FF',
          500: '#0057FF',
          600: '#0057FF',
          700: '#003FBB',
        },
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
