/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f9',
          100: '#dce6f0',
          200: '#b8cce0',
          500: '#2563eb',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#1e3a5f',
          950: '#0f1f35',
        },
      },
    },
  },
  plugins: [],
}
