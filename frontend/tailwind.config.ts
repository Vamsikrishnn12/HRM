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
          50: "#EBF7FD",
          100: "#C6EBFA",
          200: "#94D9F4",
          300: "#60C8EE",
          400: "#30B8E9",
          500: "#1DA3D4",
          600: "#178BB5",
          700: "#116E90",
          800: "#0B506A",
          900: "#063345",
        },
        accent: {
          50: "#EDEEF8",
          100: "#D0D3EE",
          200: "#A9AFD9",
          300: "#7F88C3",
          400: "#4C5CB2",
          500: "#3F4E9E",
          600: "#354289",
          700: "#2B3670",
          800: "#1F2752",
          900: "#151B3A",
        },
        navy: {
          50: "#E8ECF5",
          100: "#C3CBE3",
          200: "#8E9CC5",
          300: "#5A6DA7",
          400: "#344383",
          500: "#1B2959",
          600: "#162249",
          700: "#111A39",
          800: "#0D132A",
          900: "#080C1B",
        },
        lavender: {
          50: "#F4F2FA",
          100: "#E4E0F2",
          200: "#CDC6E5",
          300: "#B6ABD8",
          400: "#A095CF",
          500: "#8A7DBF",
          600: "#7367AB",
          700: "#5C5190",
          800: "#453D6E",
          900: "#30294D",
        },
        wash: {
          50: "#F8FAFD",
          100: "#E1E7F5",
          200: "#CAD3EB",
          300: "#B0BCE0",
          400: "#97A6D5",
          500: "#7D90CB",
        },
        surface: "#F5F7FB",
        "surface-border": "#E1E7F5",
        heading: "#1B2959",
        "text-body": "#2D3A5C",
        muted: "#6B7A99",
      },
      fontFamily: {
        heading: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(27,41,89,0.04), 0 1px 2px -1px rgba(27,41,89,0.03)",
        "card-hover":
          "0 8px 24px -4px rgba(27,41,89,0.08), 0 2px 6px -2px rgba(27,41,89,0.04)",
        sidebar: "2px 0 16px 0 rgba(27,41,89,0.05)",
        soft: "0 2px 8px 0 rgba(27,41,89,0.06)",
        elevated:
          "0 12px 32px -8px rgba(27,41,89,0.12), 0 4px 8px -4px rgba(27,41,89,0.06)",
        "focus-ring": "0 0 0 3px rgba(48,184,233,0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
