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
          50: "#EAF5FF",
          100: "#D5EAFF",
          200: "#A9D3FF",
          300: "#73B8FF",
          400: "#0B72E7",
          500: "#075FC7",
          600: "#084FA5",
          700: "#0A427F",
          800: "#0B365F",
          900: "#082944",
        },
        accent: {
          50: "#E9FBF6",
          100: "#CBF7E9",
          200: "#98EED4",
          300: "#5DE1BA",
          400: "#20C997",
          500: "#12AE82",
          600: "#0B8C6A",
          700: "#0B7057",
          800: "#0C5947",
          900: "#09493B",
        },
        navy: {
          50: "#EEF5FA",
          100: "#D8E6F0",
          200: "#B8CDDD",
          300: "#86A7C0",
          400: "#4E7898",
          500: "#082B4C",
          600: "#072642",
          700: "#061F37",
          800: "#04182B",
          900: "#03111F",
        },
        lavender: {
          50: "#F2F7FB",
          100: "#E2ECF5",
          200: "#B8CCE0",
          300: "#9DB8D1",
          400: "#7FA6C8",
          500: "#668FB3",
          600: "#4D789E",
          700: "#376285",
          800: "#254E70",
          900: "#173B59",
        },
        wash: {
          50: "#F8FBFD",
          100: "#EDF3F8",
          200: "#DCE7F0",
          300: "#C7D7E5",
          400: "#AFC6D9",
          500: "#93B2CC",
        },
        surface: "#F5F8FC",
        "surface-border": "#DDE7F0",
        heading: "#082B4C",
        "text-body": "#334E68",
        muted: "#708399",
      },
      fontFamily: {
        heading: ["Manrope", "DM Sans", "system-ui", "sans-serif"],
        sans: ["DM Sans", "Manrope", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1.125rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(11,114,231,0.04), 0 1px 2px -1px rgba(11,114,231,0.03)",
        "card-hover":
          "0 10px 30px -6px rgba(11,114,231,0.10), 0 4px 8px -2px rgba(11,114,231,0.05)",
        sidebar: "2px 0 20px 0 rgba(11,114,231,0.06)",
        soft: "0 2px 10px 0 rgba(11,114,231,0.07)",
        elevated:
          "0 16px 40px -8px rgba(11,114,231,0.14), 0 6px 12px -4px rgba(11,114,231,0.07)",
        "focus-ring": "0 0 0 3px rgba(11,114,231,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
