/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050510",
        surface: "#0F1117",
        primary: "#6C47FF",
        secondary: "#00D4FF",
        accent: "#FF6B35",
      }
    },
  },
  plugins: [],
}
