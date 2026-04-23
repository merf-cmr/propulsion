/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        violet: {
          DEFAULT: '#6B3FA0',
          light: '#EDE7F6',
          dark: '#4A2A72',
        },
        orange: {
          propulsion: '#F5A623',
        },
        red: {
          propulsion: '#D0021B',
        },
        blue: {
          propulsion: '#1A6BB5',
        },
        navy: '#1A1A2E',
        surface: '#F4F4F8',
        whatsapp: '#25D366',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        btn: '12px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.08)',
        nav: '0 -1px 0 rgba(0,0,0,0.08)',
      },
      height: {
        nav: '64px',
        btn: '48px',
      },
      minHeight: {
        touch: '44px',
      },
    },
  },
  plugins: [],
}
