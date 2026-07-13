import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      colors: {
        paper: "#FAF9F5",
        ink: {
          DEFAULT: "#22201B",
          muted: "#726C60",
          faint: "#A7A192",
        },
        border: {
          DEFAULT: "#E6E2D6",
        },
        moss: {
          50: "#EEF4F1",
          100: "#D7E5DE",
          400: "#4B8873",
          500: "#2F6F5B",
          600: "#24594A",
          700: "#1B4438",
        },
        clay: {
          400: "#D9954F",
          500: "#C87F35",
          600: "#A8672A",
        },
        danger: {
          50: "#FBEEEB",
          400: "#CB5A3E",
          500: "#B3432B",
          600: "#8F3521",
        },
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(34,32,27,0.06), 0 1px 1px rgba(34,32,27,0.04)",
        pop: "0 12px 32px rgba(34,32,27,0.14), 0 2px 8px rgba(34,32,27,0.08)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
