/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4287f5',
        secondary: '#6c757d',
        danger: '#dc3545',
        success: '#28a745',
      },
    },
  },
  plugins: [],
}

