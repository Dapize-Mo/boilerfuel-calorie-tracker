/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.25rem',
        lg: '2rem',
        xl: '2.5rem',
      },
    },
    extend: {
      boxShadow: {
        'soft': '0 10px 25px -10px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
};
