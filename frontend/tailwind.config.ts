import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#B8CEDE',
        'bg-app': '#0F1624',
        'bg-sidebar': '#0B1323',
        'accent-cyan': '#5BC8F5',
        'accent-purple': '#A78BFA',
        'accent-violet': '#7C3AED',
        'text-muted': '#8BA3B8',
        'card-glass': 'rgba(255,255,255,0.06)',
        'card-border': 'rgba(255,255,255,0.10)',
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'glass': '16px',
        'glass-lg': '24px',
        'pill': '999px',
      },
      backdropBlur: {
        'glass': '12px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'typing': 'typing 1.4s infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        typing: {
          '0%, 60%, 100%': { opacity: '0.3' },
          '30%': { opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(91,200,245,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(91,200,245,0.6)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
