/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f7f8eb',
          100: '#eef0d4',
          200: '#dfe2bb',
          300: '#c9cba4',
          400: '#afb284',
          500: '#8f9466',
          600: '#73774e',
          700: '#585b3c',
          800: '#41432d',
          900: '#2c2e20',
          950: '#181913',
        },
        yellow: {
          50: '#f7f8eb',
          100: '#eef0d4',
          200: '#dfe2bb',
          300: '#c9cba4',
          400: '#afb284',
          500: '#8f9466',
          600: '#73774e',
          700: '#585b3c',
          800: '#41432d',
          900: '#2c2e20',
          950: '#181913',
        },
        dark: {
          950: '#050505',
          900: '#090909',
          800: '#141414',
          700: '#242424',
          600: '#333333',
        },
        warm: {
          50: '#f7f2e8',
          100: '#efe7d8',
          200: '#e3d8c6',
          300: '#d2c3ad',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blob': 'blob 8s infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(201, 203, 164, 0.18)' },
          '100%': { boxShadow: '0 0 40px rgba(201, 203, 164, 0.30)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
