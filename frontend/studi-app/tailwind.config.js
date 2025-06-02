/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/(tabs)/**/*.{js,jsx,ts,tsx}",
    "./context/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: '#282257',        // Dark purple
        accent: '#E05F61',         // Coral accent
        
        // Layout colors
        layout: {
          'off-white': '#EEEDED',
          'faded-grey': '#959595',
          'dark-grey': '#656565',
          'grey-blue': '#828BB6',
        },
        
        // Category colors
        category: {
          coral: '#F46D75',
          teal: '#2EC4B6',
          yellow: '#F3C44B',
          purple: '#5A4FCF',
          blue: '#4F9DDE',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        body: ['Poppins', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

