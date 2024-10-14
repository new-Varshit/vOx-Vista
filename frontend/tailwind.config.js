/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors:{
        primary:'#2563EB',
        anotherPrimary:'#1D4ED8',
        secondary:'#4B5563',
        font:'#4B5563'

      }
    },
  },
  plugins: [
    require('tailwind-scrollbar')
  ],
}