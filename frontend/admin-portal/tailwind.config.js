/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        indigo: {
          50:  '#e0e0ff',
          100: '#bdc2ff',
          200: '#8690ee',
          300: '#6674e8',
          400: '#4d5fd6',
          500: '#4555b7',
          600: '#3a47a0',
          700: '#2e3a88',
          800: '#1a237e',
          900: '#000666',
          950: '#00044a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
