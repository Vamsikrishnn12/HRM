import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#F3EEFE",
          100: "#E2D6FD",
          200: "#C4ADFC",
          300: "#A785FA",
          400: "#8B5CF6",
          500: "#7C3AED",
          600: "#6D28D9",
          700: "#5B21B6",
          800: "#4C1D95",
          900: "#3B0764",
        },
        surface: "#F8F8FC",
        border: "#EEEEF4",
        heading: "#0B1220",
        muted: "#64748B",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(139,92,246,0.04), 0 1px 2px -1px rgba(139,92,246,0.06)",
        "card-hover":
          "0 4px 12px 0 rgba(139,92,246,0.10), 0 2px 4px -2px rgba(139,92,246,0.06)",
        sidebar: "2px 0 12px 0 rgba(11,18,32,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
