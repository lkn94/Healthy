/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#080A1A',
        aurora: '#37F2C0',
        eclipse: '#101326',
        pulse: '#FF7D96'
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Sora', 'sans-serif']
      },
      boxShadow: {
        glow: '0 20px 60px rgba(55, 242, 192, 0.15)'
      }
    }
  },
  plugins: []
};
