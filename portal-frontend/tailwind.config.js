/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        // Definir las mismas variables que usas en tu frontend principal
        colors: {
          // Podemos acceder a las variables CSS declaradas en :root
          'accent-1': 'var(--color-accent-1)',
          'accent-2': 'var(--color-accent-2)',
          'text-main': 'var(--color-text-main)',
          'text-secondary': 'var(--color-text-secondary)',
          'bg-main': 'var(--color-bg-main)',
          'bg-secondary': 'var(--color-bg-secondary)',
        }
      },
    },
    plugins: [],
  }