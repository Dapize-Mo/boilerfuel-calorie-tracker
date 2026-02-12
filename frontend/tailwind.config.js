/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.25rem',
        lg: '2rem',
        xl: '2.5rem',
        '2xl': '3rem',
      },
    },
    extend: {
      colors: {
        // CSS variable-based theme colors (for light/dark mode)
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
        // Additional gradient-friendly colors
        primary: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        secondary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Cal Sans', 'Inter', '-apple-system', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '120': '30rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.05, 0.7, 0.1, 1.0)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.05, 0.7, 0.1, 1.0)',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.05, 0.7, 0.1, 1.0)',
        'slide-out-right': 'slideOutRight 0.3s cubic-bezier(0.3, 0.0, 0.8, 0.15)',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        'floating': 'floating 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'wiggle': 'wiggle 1s ease-in-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideOutRight: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        floating: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(250, 204, 21, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(250, 204, 21, 0.8)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.04)',
        'glow-sm': '0 0 20px rgba(250, 204, 21, 0.3)',
        'glow': '0 0 30px rgba(250, 204, 21, 0.4)',
        'glow-lg': '0 0 40px rgba(250, 204, 21, 0.5)',
        'inner-glow': 'inset 0 2px 10px rgba(250, 204, 21, 0.1)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.05, 0.7, 0.1, 1.0)',
        'spring-out': 'cubic-bezier(0.3, 0.0, 0.8, 0.15)',
      },
      minHeight: {
        'screen-90': '90vh',
        'screen-80': '80vh',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
  ],
};
