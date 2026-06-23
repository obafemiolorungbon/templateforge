import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        console: '#11100E',
        panel: '#181715',
        pressed: '#211F1C',
        paper: '#F4EFE6',
        ash: '#A69D90',
        moss: '#B8D66B',
        clay: '#E66A5C',
        brass: 'rgba(217, 170, 92, 0.28)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular'],
      },
    },
  },
  plugins: [],
};

export default config;
