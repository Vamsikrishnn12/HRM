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
          50: "#F3EEFB",
          100: "#E0D3F5",
          200: "#C5AAEC",
          300: "#A97FE2",
          400: "#7548b9",
          500: "#6A3FAF",
          600: "#5C359E",
          700: "#4B2A82",
          800: "#3A2066",
          900: "#29164A",
        },
        accent: {
          50: "#EDF6FD",
          100: "#CFE8FA",
          200: "#A3D2F5",
          300: "#6DBAEF",
          400: "#359de9",
          500: "#2D8BD4",
          600: "#2578BA",
          700: "#1D6199",
          800: "#154A78",
          900: "#0D3357",
        },
        navy: {
          50: "#ECEEF5",
          100: "#CDD1E3",
          200: "#9AA1C5",
          300: "#6770A7",
          400: "#3E4783",
          500: "#1E2548",
          600: "#181D3B",
          700: "#12162E",
          800: "#0C0F21",
          900: "#070914",
        },
        lavender: {
          50: "#F5F1FB",
          100: "#E5DCF5",
          200: "#D1C3EC",
          300: "#BBA8E2",
          400: "#A58FD8",
          500: "#8E76CA",
          600: "#7760B8",
          700: "#5F4A9A",
          800: "#47377C",
          900: "#31265C",
        },
        wash: {
          50: "#F8F6FC",
          100: "#EDE8F6",
          200: "#DDD5ED",
          300: "#CBC0E3",
          400: "#B9ABD9",
          500: "#A596CF",
        },
        surface: "#F4F2F9",
        "surface-border": "#E8E4F0",
        heading: "#1E2548",
        "text-body": "#3B3F5C",
        muted: "#7C7F99",
      },
      fontFamily: {
        heading: ["Plus Jakarta Sans", "Manrope", "system-ui", "sans-serif"],
        sans: ["Plus Jakarta Sans", "Manrope", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1.125rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(117,72,185,0.04), 0 1px 2px -1px rgba(117,72,185,0.03)",
        "card-hover":
          "0 10px 30px -6px rgba(117,72,185,0.10), 0 4px 8px -2px rgba(117,72,185,0.05)",
        sidebar: "2px 0 20px 0 rgba(117,72,185,0.06)",
        soft: "0 2px 10px 0 rgba(117,72,185,0.07)",
        elevated:
          "0 16px 40px -8px rgba(117,72,185,0.14), 0 6px 12px -4px rgba(117,72,185,0.07)",
        "focus-ring": "0 0 0 3px rgba(117,72,185,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
