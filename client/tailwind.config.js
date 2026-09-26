/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: '#FFD23F',
          gold: '#F5A623',
          dark: '#0B0B0C',
          light: '#F7F7F5'
        },
        ink: {
          DEFAULT: '#0B0B0C',
          900: '#111113',
          800: '#1C1C1F',
          700: '#2A2A2E',
          600: '#3F3F46',
          500: '#71717A',
          400: '#A1A1AA',
          300: '#D4D4D8',
          200: '#E7E7EA',
          100: '#F2F2F0',
          50: '#F9F9F7'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16,16,20,0.04), 0 4px 16px -4px rgba(16,16,20,0.06)',
        card: '0 1px 2px rgba(16,16,20,0.04), 0 12px 32px -12px rgba(16,16,20,0.14)',
        lift: '0 2px 4px rgba(16,16,20,0.04), 0 24px 48px -16px rgba(16,16,20,0.22)',
        glow: '0 8px 30px -6px rgba(255,210,63,0.55)',
        'inner-line': 'inset 0 0 0 1px rgba(255,255,255,0.08)'
      },
      letterSpacing: {
        tightest: '-0.045em'
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        }
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        float: 'float 6s ease-in-out infinite',
        'gradient-pan': 'gradient-pan 8s ease infinite',
        'fade-up': 'fade-up 0.5s ease-out both'
      }
    },
  },
  plugins: [],
}
