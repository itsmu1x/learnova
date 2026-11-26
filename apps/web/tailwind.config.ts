import type { Config } from 'tailwindcss';

// Palette is lifted from the logo: cobalt cap + marigold tassel on deep navy.
// `slate` and `indigo` are remapped so every existing page picks up the new look.
const slate = {
  50: '#F7F8FB',
  100: '#EEF0F6',
  200: '#E1E4EE',
  300: '#C8CDDC',
  400: '#9AA2BA',
  500: '#5E6884',
  600: '#4A5470',
  700: '#343D58',
  800: '#222A43',
  900: '#161D33',
  950: '#0C1224',
};

const cobalt = {
  50: '#EEF2FD',
  100: '#DCE5FB',
  200: '#BCCCF7',
  300: '#8FA9F1',
  400: '#6E8FF0',
  500: '#3A66DE',
  600: '#2756D8',
  700: '#1F46B6',
  800: '#1C3A91',
  900: '#1B3373',
  950: '#121F45',
};

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        slate,
        indigo: cobalt,
        brand: cobalt,
        paper: {
          DEFAULT: 'rgb(var(--canvas) / <alpha-value>)',
          elev: 'rgb(var(--surface) / <alpha-value>)',
          ink: '#0F1A3A',
          mute: 'rgb(var(--mute) / <alpha-value>)',
          line: 'rgb(var(--line) / <alpha-value>)',
        },
        signal: {
          DEFAULT: '#2756D8',
          soft: 'rgb(var(--signal-soft) / <alpha-value>)',
          deep: '#1C3FA8',
          bright: '#6E8FF0',
        },
        marigold: {
          DEFAULT: '#FFAE1A',
          deep: '#B87400',
          soft: '#FFF1D3',
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};

export default config;
