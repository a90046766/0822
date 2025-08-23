/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#00B5AD',
          50: '#E6FFFB',
          100: '#CFF9F4',
          200: '#A8F0E8',
          300: '#6FE2D7',
          400: '#3AD1C5',
          500: '#00B5AD',
          600: '#0EA5A4',
        },
        accent: { orange: '#FF8A4D', warn: '#F59E0B', success: '#22C55E' },
      },
      boxShadow: {
        card: '0 8px 24px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}


