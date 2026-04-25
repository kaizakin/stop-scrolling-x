/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        mist: '#eef2ff',
        accent: '#f97316',
        accentSoft: '#fed7aa',
      },
      boxShadow: {
        glow: '0 24px 80px rgba(15, 23, 42, 0.24)',
      },
      fontFamily: {
        display: [
          '"Avenir Next"',
          '"SF Pro Display"',
          '"Segoe UI"',
          '"Helvetica Neue"',
          'ui-sans-serif',
          'sans-serif',
        ],
        body: ['"Aptos"', '"Inter"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"SFMono-Regular"', '"Cascadia Code"', '"Consolas"', 'monospace'],
      },
    },
  },
  plugins: [],
};
