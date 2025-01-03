const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1225px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-simplon-norm)", ...defaultTheme.fontFamily.sans],
        mono: ["var(--font-simplon-mono)", ...defaultTheme.fontFamily.mono],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      colors: {
        deepPink: "#BD195D",
        purplePanel: "#010513",
        darkPurple: "#181424",
        limeGreen: "#32CD32", //'#A2E634', // defifa '#32CD32', #8cc929
        limeGreenOpacity: "rgba(162, 230, 52, 0.7)",
        lightPurple: "#C0B2F0",
        fontRed: "#EC017C",
        notWhite: "#FEA282",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/forms")],
};
