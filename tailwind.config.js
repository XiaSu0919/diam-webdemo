/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")], // Add daisyUI plugin
  // Optional: Configure daisyUI themes (default: light/dark themes)
  daisyui: {
    themes: ["light", "dark", "cupcake"], // Add your preferred themes
    darkTheme: "dark", // Default dark theme
    base: true, // Applies base styles (recommended)
    styled: true, // Includes component styling
    utils: true, // Includes responsive modifiers
  },
}

