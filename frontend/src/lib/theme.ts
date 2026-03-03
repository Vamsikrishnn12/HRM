import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
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
    indigo: {
      50: "#EDEDFB",
      100: "#D4D4F5",
      200: "#ABABEB",
      300: "#8282E0",
      400: "#7B7BE0",
      500: "#5E5FD1",
      600: "#4A4BB8",
    },
    accent: {
      cyan: "#26D4F3",
      purple: "#A15EE2",
    },
    surface: {
      bg: "#F8F8FC",
      card: "#FFFFFF",
      border: "#EEEEF4",
    },
    text: {
      heading: "#0B1220",
      body: "#1A2740",
      muted: "#64748B",
    },
  },
  fonts: {
    heading: `'Plus Jakarta Sans', system-ui, sans-serif`,
    body: `'Plus Jakarta Sans', system-ui, sans-serif`,
  },
  radii: {
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "20px",
  },
  shadows: {
    card: "0 1px 3px 0 rgba(139,92,246,0.04), 0 1px 2px -1px rgba(139,92,246,0.06)",
    "card-hover":
      "0 4px 12px 0 rgba(139,92,246,0.10), 0 2px 4px -2px rgba(139,92,246,0.06)",
    sidebar: "2px 0 12px 0 rgba(11,18,32,0.04)",
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: "600",
        borderRadius: "lg",
      },
      variants: {
        primary: {
          bg: "brand.400",
          color: "white",
          _hover: { bg: "brand.500", transform: "translateY(-1px)", shadow: "md" },
          _active: { bg: "brand.600", transform: "translateY(0)" },
        },
        secondary: {
          bg: "white",
          color: "brand.500",
          border: "1px solid",
          borderColor: "surface.border",
          _hover: { bg: "brand.50", borderColor: "brand.200" },
        },
        ghost: {
          color: "text.muted",
          _hover: { bg: "surface.bg", color: "brand.500" },
        },
      },
    },
    Badge: {
      variants: {
        success: {
          bg: "#E6F9F0",
          color: "#0D7C47",
          fontWeight: "600",
          fontSize: "xs",
          px: 2.5,
          py: 0.5,
          borderRadius: "full",
        },
        warning: {
          bg: "#FFF4E5",
          color: "#B25E09",
          fontWeight: "600",
          fontSize: "xs",
          px: 2.5,
          py: 0.5,
          borderRadius: "full",
        },
        danger: {
          bg: "#FEE7E7",
          color: "#C41E3A",
          fontWeight: "600",
          fontSize: "xs",
          px: 2.5,
          py: 0.5,
          borderRadius: "full",
        },
        info: {
          bg: "#F3EEFE",
          color: "#6D28D9",
          fontWeight: "600",
          fontSize: "xs",
          px: 2.5,
          py: 0.5,
          borderRadius: "full",
        },
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: "white",
        color: "text.body",
      },
    },
  },
});

export default theme;
