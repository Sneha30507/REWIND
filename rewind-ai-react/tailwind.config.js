/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#0A0A18',
          900: '#0C0C1C',
          850: '#0E0E22',
          800: '#101026',
          700: '#10102A',
        },
        line: {
          DEFAULT: '#1C1C3A',
          soft: '#1A1A38',
          card: '#23234A',
          strong: '#2C2C58',
        },
        brand: {
          DEFAULT: '#6D4DF2',
          hover: '#7E61F7',
          dark: '#4B35C9',
          accent: '#A97BFF',
          link: '#9D86FF',
        },
        muted: '#A8A8C8',
        dim: '#8F8FB0',
      },
    },
  },
  plugins: [],
}
