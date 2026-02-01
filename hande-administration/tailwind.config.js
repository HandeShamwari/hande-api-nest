/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // Hande Brand Colors
        'hande-green': '#7ED957',
        'hande-gold': '#FFB800',
        'hande-black': '#000000',
        'hande-white': '#FFFFFF',
        'hande-gray': '#F5F5F5',
        'hande-dark-gray': '#333333',
        'hande-red': '#FF4C4C',
        'hande-blue': '#4DA6FF',
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
