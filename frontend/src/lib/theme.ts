import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

/* ─── Palette ─────────────────────────────────────────────────────
   Primary:  #7548b9 (rich purple)
   Accent:   #359de9 (vibrant blue)
   Gradient: linear-gradient(135deg, #7548b9, #359de9)
   ──────────────────────────────────────────────────────────────── */

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,

  /* ── Colors ─────────────────────────────────────────────────── */
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
      600: "#8F7EC4",
      700: "#7A68B3",
      800: "#60508F",
      900: "#463A6B",
    },
    surface: {
      bg: "#F4F2F9",
      card: "#FFFFFF",
      border: "#E8E4F0",
    },
    text: {
      heading: "#1E2548",
      body: "#3B3F5C",
      muted: "#7C7F99",
    },
  },

  /* ── Fonts ─────────────────────────────────────────────────── */
  fonts: {
    heading: `'Plus Jakarta Sans', 'Manrope', system-ui, sans-serif`,
    body: `'Plus Jakarta Sans', 'Manrope', system-ui, sans-serif`,
  },

  /* ── Radii ─────────────────────────────────────────────────── */
  radii: {
    sm: "8px",
    md: "10px",
    lg: "14px",
    xl: "18px",
    "2xl": "22px",
    "3xl": "28px",
  },

  /* ── Shadows ───────────────────────────────────────────────── */
  shadows: {
    card: "0 1px 3px 0 rgba(117,72,185,0.04), 0 1px 2px -1px rgba(117,72,185,0.03)",
    "card-hover":
      "0 10px 30px -6px rgba(117,72,185,0.10), 0 4px 8px -2px rgba(117,72,185,0.05)",
    sidebar: "2px 0 20px 0 rgba(117,72,185,0.06)",
    soft: "0 2px 10px 0 rgba(117,72,185,0.07)",
    elevated:
      "0 16px 40px -8px rgba(117,72,185,0.14), 0 6px 12px -4px rgba(117,72,185,0.07)",
    "focus-ring": "0 0 0 3px rgba(117,72,185,0.25)",
  },

  /* ── Component overrides ───────────────────────────────────── */
  components: {
    Button: {
      baseStyle: {
        fontWeight: "600",
        borderRadius: "lg",
        fontFamily: `'Plus Jakarta Sans', 'Manrope', system-ui, sans-serif`,
        transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
      },
      sizes: {
        sm: { fontSize: "sm", px: 4, h: 9 },
        md: { fontSize: "sm", px: 5, h: 10 },
        lg: { fontSize: "md", px: 6, h: 12 },
      },
      variants: {
        primary: {
          bg: "brand.400",
          color: "white",
          _hover: {
            bg: "brand.500",
            transform: "translateY(-1px)",
            shadow: "soft",
            _disabled: { bg: "brand.400", transform: "none", shadow: "none" },
          },
          _active: { bg: "brand.600", transform: "translateY(0)" },
          _focusVisible: { shadow: "focus-ring" },
        },
        accent: {
          bg: "accent.400",
          color: "white",
          _hover: {
            bg: "accent.500",
            transform: "translateY(-1px)",
            shadow: "soft",
            _disabled: { bg: "accent.400", transform: "none" },
          },
          _active: { bg: "accent.600", transform: "translateY(0)" },
          _focusVisible: { shadow: "0 0 0 3px rgba(53,157,233,0.3)" },
        },
        secondary: {
          bg: "white",
          color: "brand.400",
          border: "1px solid",
          borderColor: "surface.border",
          _hover: { bg: "brand.50", borderColor: "brand.200" },
          _active: { bg: "brand.100" },
          _focusVisible: { shadow: "focus-ring" },
        },
        ghost: {
          color: "text.muted",
          _hover: { bg: "brand.50", color: "brand.400" },
          _active: { bg: "brand.100" },
          _focusVisible: { shadow: "focus-ring" },
        },
        outline: {
          color: "brand.400",
          border: "1px solid",
          borderColor: "brand.400",
          bg: "transparent",
          _hover: { bg: "brand.50" },
          _active: { bg: "brand.100" },
        },
      },
      defaultProps: {
        variant: "primary",
      },
    },

    Badge: {
      baseStyle: {
        fontWeight: "600",
        fontSize: "xs",
        px: 2.5,
        py: 0.5,
        borderRadius: "full",
        textTransform: "capitalize",
      },
      variants: {
        success: {
          bg: "#E6F9F0",
          color: "#0D7C47",
        },
        warning: {
          bg: "#FEF9EC",
          color: "#92640D",
        },
        danger: {
          bg: "#FEF0F0",
          color: "#C41E3A",
        },
        info: {
          bg: "brand.50",
          color: "brand.400",
        },
        neutral: {
          bg: "surface.bg",
          color: "text.muted",
        },
      },
    },

    Input: {
      variants: {
        outline: {
          field: {
            borderRadius: "lg",
            bg: "white",
            border: "1px solid",
            borderColor: "surface.border",
            fontSize: "sm",
            _placeholder: { color: "text.muted" },
            _hover: { borderColor: "brand.200" },
            _focus: {
              borderColor: "brand.400",
              boxShadow: "focus-ring",
              bg: "white",
            },
          },
        },
      },
      defaultProps: {
        variant: "outline",
      },
    },

    Select: {
      variants: {
        outline: {
          field: {
            borderRadius: "lg",
            bg: "white",
            border: "1px solid",
            borderColor: "surface.border",
            fontSize: "sm",
            _hover: { borderColor: "brand.200" },
            _focus: {
              borderColor: "brand.400",
              boxShadow: "focus-ring",
            },
          },
        },
      },
      defaultProps: {
        variant: "outline",
      },
    },

    Textarea: {
      variants: {
        outline: {
          borderRadius: "lg",
          bg: "white",
          border: "1px solid",
          borderColor: "surface.border",
          fontSize: "sm",
          _placeholder: { color: "text.muted" },
          _hover: { borderColor: "brand.200" },
          _focus: {
            borderColor: "brand.400",
            boxShadow: "focus-ring",
          },
        },
      },
    },

    Modal: {
      baseStyle: {
        dialog: {
          borderRadius: "2xl",
          shadow: "elevated",
          border: "1px solid",
          borderColor: "surface.border",
        },
        header: {
          fontFamily: `'Plus Jakarta Sans', 'Manrope', system-ui, sans-serif`,
          fontWeight: "700",
          fontSize: "lg",
          py: 5,
          px: 6,
        },
        body: {
          px: 6,
          py: 5,
        },
        footer: {
          px: 6,
          py: 4,
        },
        closeButton: {
          top: 4,
          right: 4,
          _focusVisible: { shadow: "focus-ring" },
        },
      },
    },

    Table: {
      variants: {
        simple: {
          th: {
            fontSize: "11px",
            color: "text.muted",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "wider",
            borderColor: "surface.border",
            bg: "surface.bg",
            py: 3.5,
            fontFamily: `'Plus Jakarta Sans', 'Manrope', system-ui, sans-serif`,
          },
          td: {
            borderColor: "surface.border",
            fontSize: "sm",
            color: "text.body",
            py: 4,
          },
          tr: {
            _hover: { bg: "brand.50" },
            transition: "all 0.2s cubic-bezier(.4,0,.2,1)",
          },
        },
      },
    },

    Menu: {
      baseStyle: {
        list: {
          borderRadius: "xl",
          shadow: "elevated",
          border: "1px solid",
          borderColor: "surface.border",
          py: 1.5,
          minW: "180px",
        },
        item: {
          fontSize: "sm",
          px: 4,
          py: 2.5,
          borderRadius: "md",
          mx: 1.5,
          _hover: { bg: "brand.50" },
          _focus: { bg: "brand.50" },
          transition: "all 0.15s ease",
        },
      },
    },

    Popover: {
      baseStyle: {
        content: {
          borderRadius: "xl",
          shadow: "elevated",
          border: "1px solid",
          borderColor: "surface.border",
        },
      },
    },

    Tabs: {
      variants: {
        line: {
          tab: {
            fontWeight: "600",
            fontSize: "sm",
            color: "text.muted",
            _selected: { color: "brand.400", borderColor: "brand.400" },
            _hover: { color: "brand.400" },
            _focusVisible: { shadow: "focus-ring" },
          },
          tablist: {
            borderColor: "surface.border",
          },
        },
      },
    },

    Switch: {
      baseStyle: {
        track: {
          _checked: { bg: "brand.400" },
        },
      },
    },

    Checkbox: {
      baseStyle: {
        control: {
          borderColor: "surface.border",
          borderRadius: "md",
          _checked: {
            bg: "brand.400",
            borderColor: "brand.400",
            _hover: { bg: "brand.500", borderColor: "brand.500" },
          },
          _focusVisible: { shadow: "focus-ring" },
        },
      },
    },

    Tooltip: {
      baseStyle: {
        borderRadius: "lg",
        px: 3,
        py: 2,
        fontSize: "xs",
        fontWeight: "500",
        bg: "navy.500",
        color: "white",
        shadow: "elevated",
      },
    },

    Alert: {
      variants: {
        subtle: {
          container: {
            borderRadius: "xl",
          },
        },
      },
    },

    FormLabel: {
      baseStyle: {
        fontSize: "sm",
        fontWeight: "600",
        color: "text.heading",
        mb: 1.5,
      },
    },

    Divider: {
      baseStyle: {
        borderColor: "surface.border",
      },
    },

    Spinner: {
      defaultProps: {
        colorScheme: "brand",
      },
    },
  },

  /* ── Global Styles ─────────────────────────────────────────── */
  styles: {
    global: {
      body: {
        bg: "white",
        color: "text.body",
        fontFamily: `'Plus Jakarta Sans', 'Manrope', system-ui, sans-serif`,
      },
      "h1, h2, h3, h4, h5, h6": {
        fontFamily: `'Plus Jakarta Sans', 'Manrope', system-ui, sans-serif`,
      },
    },
  },
});

export default theme;
