/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "on-primary": "#ffffff",
        "error": "#ba1a1a",
        "background": "#f8f9ff",
        "surface-container-high": "#dce9ff",
        "surface": "#f8f9ff",
        "outline": "#6d7a72",
        "primary": "#006948",
        "surface-container-lowest": "#ffffff",
        "surface-container": "#e5eeff",
        "surface-container-low": "#eff4ff",
        "secondary": "#565e74",
        "on-surface": "#0b1c30",
        "tertiary": "#0051d5",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "primary-container": "#00855d",
        "on-primary-container": "#f5fff7",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}