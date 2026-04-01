import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        'bg-base': 'var(--bg-base)',
        'bg-app': 'var(--bg-app)',
        'bg-sidebar': 'var(--bg-sidebar)',
        'bg-card': 'var(--bg-card)',
        'bg-card-hover': 'var(--bg-card-hover)',
        'bg-input': 'var(--bg-input)',
        'bg-input-focus': 'var(--bg-input-focus)',
        'bg-overlay': 'var(--bg-overlay)',
        'accent-cyan': 'var(--accent-cyan)',
        'accent-purple': 'var(--accent-purple)',
        'accent-violet': 'var(--accent-violet)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-inverse': 'var(--text-inverse)',
        'border-subtle': 'var(--border-subtle)',
        'border-default': 'var(--border-default)',
        'border-strong': 'var(--border-strong)',
        'success': 'var(--success)',
        'warning': 'var(--warning)',
        'error': 'var(--error)',
        'card-glass': 'var(--glass-bg)',
        'card-border': 'var(--glass-border)',
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'system-ui', 'sans-serif'],
        display: ["'Space Grotesk'", 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'glass': 'var(--radius-lg)',
        'glass-lg': 'var(--radius-xl)',
        'pill': 'var(--radius-pill)',
      },
      backdropBlur: {
        'glass': 'var(--glass-blur)',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md-theme': 'var(--shadow-md)',
        'lg-theme': 'var(--shadow-lg)',
        'glow-cyan': 'var(--shadow-glow-cyan)',
        'glow-purple': 'var(--shadow-glow-purple)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'typing': 'typing 1.4s infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'aurora': 'aurora-shift 12s ease-in-out infinite',
        'shimmer': 'shimmer-sweep 3s ease-in-out infinite',
        'marquee': 'marquee var(--duration) linear infinite',
        'marquee-vertical': 'marquee-vertical var(--duration) linear infinite',
        'spin-slow': 'spin 8s linear infinite',
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
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(calc(-100% - var(--gap)))' },
        },
        'marquee-vertical': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(calc(-100% - var(--gap)))' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
