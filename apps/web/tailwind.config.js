/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta oficial ChBook — únicos colores autorizados
        sage: {
          dark: '#4A6E4A', // CTAs, sidebar, headers
          light: '#8FAF8A', // fondo hero, acentos
        },
        brown: '#6B5344', // menús, transparencias
        cream: '#EDE8DC', // cards, fondo logo
        carbon: '#2E2E2E', // tipografía, íconos
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
