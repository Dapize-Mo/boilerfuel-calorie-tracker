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
      colors: {
        // Custom color palette using CSS variables
        'theme': {
          'bg-primary': 'rgb(var(--color-bg-primary) / <alpha-value>)',
          'bg-secondary': 'rgb(var(--color-bg-secondary) / <alpha-value>)',
          'bg-tertiary': 'rgb(var(--color-bg-tertiary) / <alpha-value>)',
          'bg-hover': 'rgb(var(--color-bg-hover) / <alpha-value>)',
          
          'text-primary': 'rgb(var(--color-text-primary) / <alpha-value>)',
          'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
          'text-tertiary': 'rgb(var(--color-text-tertiary) / <alpha-value>)',
          'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
          
          'border-primary': 'rgb(var(--color-border-primary) / <alpha-value>)',
          'border-secondary': 'rgb(var(--color-border-secondary) / <alpha-value>)',
          'border-light': 'rgb(var(--color-border-light) / <alpha-value>)',
          'border-focus': 'rgb(var(--color-border-focus) / <alpha-value>)',
          
          'accent': 'rgb(var(--color-accent-primary) / <alpha-value>)',
          'accent-hover': 'rgb(var(--color-accent-hover) / <alpha-value>)',
          'accent-light': 'rgb(var(--color-accent-light) / <alpha-value>)',
          
          'success': 'rgb(var(--color-success) / <alpha-value>)',
          'error': 'rgb(var(--color-error) / <alpha-value>)',
          'info': 'rgb(var(--color-info) / <alpha-value>)',
          'purple': 'rgb(var(--color-purple) / <alpha-value>)',
          
          'card-bg': 'rgb(var(--color-card-bg) / <alpha-value>)',
          'card-border': 'rgb(var(--color-card-border) / <alpha-value>)',
          'sidebar-bg': 'rgb(var(--color-sidebar-bg) / <alpha-value>)',
          'sidebar-border': 'rgb(var(--color-sidebar-border) / <alpha-value>)',
        },
      },
      boxShadow: {
        'soft': '0 10px 25px -10px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
};
