/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      colors: {
        zinc: {
          900: '#09090b',
        }
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'ping-ring': 'ping-ring 1.5s ease-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'thinking-1': 'thinking 1.2s ease-in-out infinite 0s',
        'thinking-2': 'thinking 1.2s ease-in-out infinite 0.2s',
        'thinking-3': 'thinking 1.2s ease-in-out infinite 0.4s',
        'slide-in-right': 'slideInRight 0.35s ease-out forwards',
        'slide-in-up': 'slideInUp 0.3s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
        'spin-slow': 'spin-slow 8s linear infinite',
        'notif': 'notifBounce 2s ease-in-out infinite',
        'rev-pulse': 'revPulse 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-dot': {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.4)' },
        },
        'ping-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'thinking': {
          '0%,100%': { opacity: '0.3', transform: 'translateY(0)' },
          '50%': { opacity: '1', transform: 'translateY(-4px)' },
        },
        'slideInRight': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slideInUp': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fadeIn': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'float': {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'notifBounce': {
          '0%,100%': { transform: 'scale(1)' },
          '30%': { transform: 'scale(1.3)' },
          '60%': { transform: 'scale(0.9)' },
        },
        'revPulse': {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        }
      }
    },
  },
  plugins: [],
}
