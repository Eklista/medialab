/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
      colors: {
        // Paleta de colores de MediaLab
        background: "#0f1117",
        foreground: "#f0f4f8",
        border: "#2e323c",
        input: "#2e323c",
        ring: "#6366f1",
        primary: {
          DEFAULT: "#6366f1",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#8b5cf6",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#1c1f26",
          foreground: "#98a2b3",
        },
        accent: {
          DEFAULT: "#22d3ee",
          foreground: "#0f172a",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        card: {
          DEFAULT: "#1a1d23",
          foreground: "#e3e8ef",
        },
        popover: {
          DEFAULT: "#1c1f26",
          foreground: "#f0f4f8",
        },
      },
    },
  },
  plugins: [],
}