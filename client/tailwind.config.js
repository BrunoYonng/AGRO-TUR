/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        agro: {
          50: "#f3f8f1",
          100: "#e2efe0",
          500: "#4CAF50",
          600: "#378a3b",
          800: "#24552e",
          900: "#173f2a",
        },
        sun: "#FFC107",
        ink: "#15251b",
        cream: "#f7f5ed",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Georgia", "Cambria", "serif"],
      },
      boxShadow: {
        soft: "0 18px 60px rgba(21, 37, 27, 0.12)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise .7s cubic-bezier(.2,.8,.2,1) both",
      },
    },
  },
  plugins: [],
};
