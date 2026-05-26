/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Brand canvas (warm yellow)
        canvas: "#FFDB5B",
        amber: "#FFF386",
        // Ink scale
        ink: "#202020",
        graphite: "#3B3B3B",
        slate: "#575656",
        stone: "#343333",
        // Neutrals
        snow: "#FFFFFF",
        cloud: "#F3F3F3",
        // Semantic
        success: "#2BB673",
        danger: "#E5484D",
        like: "#2BB673",
        nope: "#E5484D",
        superlike: "#3B82F6",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["InterDisplay", "Inter", "sans-serif"],
      },
      borderRadius: {
        card: "24px",
        btn: "16px",
        pill: "999px",
      },
      spacing: {
        gutter: "24px",
      },
    },
  },
  plugins: [],
};
