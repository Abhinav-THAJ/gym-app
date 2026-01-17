/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000', // True Black
        surface: '#1C1C1E',    // Apple Dark Gray (Cards)
        'surface-highlight': '#2C2C2E', // Lighter Gray for hover
        border: '#3A3A3C',     // Dark Border
        primary: '#FFFFFF',    // White text
        secondary: '#AEAEB2',  // Light Gray text
        accent: '#0A84FF',     // Apple Blue

        // Apple Fitness Specific Colors
        'fitness-red': '#FA114F',   // Move Ring
        'fitness-green': '#A4FF00', // Exercise Ring
        'fitness-blue': '#00F5EA',  // Stand Ring
        'fitness-yellow': '#FFE620', // Meditation/Mindfulness
        'fitness-purple': '#D488EA', // Cooldown
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'San Francisco', 'Helvetica Neue', 'sans-serif'],
      },
      boxShadow: {
        'glow-red': '0 0 20px rgba(250, 17, 79, 0.5)',
        'glow-green': '0 0 20px rgba(164, 255, 0, 0.5)',
        'glow-blue': '0 0 20px rgba(0, 245, 234, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
