/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./app/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
      "./contexts/**/*.{js,ts,jsx,tsx}",
      "./lib/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: ['class', '[data-theme="dark"]'],
    theme: {
      extend: {
        colors: {
          // CSS Custom Properties Support
          background: 'var(--background)',
          foreground: 'var(--foreground)',
          card: {
            DEFAULT: 'var(--card-bg)',
            foreground: 'var(--foreground)',
          },
          border: 'var(--border)',
          muted: {
            DEFAULT: 'var(--muted)',
            foreground: 'var(--muted)',
          },
          accent: {
            DEFAULT: 'var(--accent)',
            hover: 'var(--accent-hover)',
          },
          sidebar: 'var(--sidebar)',
          panel: 'var(--panel)',
          hover: 'var(--hover)',
          'secondary-bg': 'var(--secondary-bg)',
          'input-bg': 'var(--input-bg)',
          // Trading-Specific Colors
          trading: {
            buy: 'var(--trading-buy)',
            sell: 'var(--trading-sell)',
            profit: 'var(--trading-profit)',
            loss: 'var(--trading-loss)',
            neutral: 'var(--trading-neutral)',
          },
          // System Colors
          success: 'var(--success)',
          warning: 'var(--warning)',
          error: 'var(--error)',
          info: 'var(--info)',
        },
        boxShadow: {
          'custom': 'var(--shadow)',
          'custom-lg': 'var(--shadow-lg)',
          'custom-xl': 'var(--shadow-xl)',
        },
        backgroundImage: {
          'gradient-primary': 'var(--gradient-primary)',
          'gradient-buy': 'var(--gradient-buy)',
          'gradient-sell': 'var(--gradient-sell)',
          'gradient-success': 'var(--gradient-success)',
          'gradient-warning': 'var(--gradient-warning)',
          'gradient-error': 'var(--gradient-error)',
        },
        maxWidth: {
          'container': '1400px',
          'container-tight': '1200px',
        },
        spacing: {
          'container': '1rem',
          'container-sm': '1.5rem',
          'container-lg': '2rem',
        },
        borderRadius: {
          'card': '12px',
          'button': '8px',
        },
        fontSize: {
          'xs': ['0.7rem', { lineHeight: '1rem' }],
          'sm': ['0.875rem', { lineHeight: '1.25rem' }],
          'base': ['1rem', { lineHeight: '1.5rem' }],
          'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        },
        animation: {
          'fade-in': 'fadeIn 0.5s ease-out',
          'slide-in': 'slideIn 0.3s ease',
          'loading': 'loading 1.5s infinite',
        },
        keyframes: {
          fadeIn: {
            'from': { opacity: '0' },
            'to': { opacity: '1' },
          },
          slideIn: {
            'from': { transform: 'translateX(100%)', opacity: '0' },
            'to': { transform: 'translateX(0)', opacity: '1' },
          },
          loading: {
            '0%': { backgroundPosition: '200% 0' },
            '100%': { backgroundPosition: '-200% 0' },
          },
        },
      },
    },
    plugins: [],
  }
  