import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

/* ─── Palette ─────────────────────────────────────────────────────
   Primary:  #0B72E7 (connection blue)
   Accent:   #20C997 (people green)
   Gradient: linear-gradient(135deg, #0B72E7, #20C997)
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
      600: "#769AB8",
      700: "#587D9C",
      800: "#3D607D",
      900: "#29465F",
    },
    surface: {
      bg: "#F5F8FC",
      card: "#FFFFFF",
      border: "#DDE7F0",
    },
    text: {
      heading: "#082B4C",
      body: "#334E68",
      muted: "#708399",
    },
  },

  /* ── Fonts ─────────────────────────────────────────────────── */
  fonts: {
    heading: `'Manrope', 'DM Sans', system-ui, sans-serif`,
    body: `'DM Sans', 'Manrope', system-ui, sans-serif`,
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
    card: "0 1px 3px 0 rgba(11,114,231,0.04), 0 1px 2px -1px rgba(11,114,231,0.03)",
    "card-hover":
      "0 10px 30px -6px rgba(11,114,231,0.10), 0 4px 8px -2px rgba(11,114,231,0.05)",
    sidebar: "2px 0 20px 0 rgba(11,114,231,0.06)",
    soft: "0 2px 10px 0 rgba(11,114,231,0.07)",
    elevated:
      "0 16px 40px -8px rgba(11,114,231,0.14), 0 6px 12px -4px rgba(11,114,231,0.07)",
    "focus-ring": "0 0 0 3px rgba(11,114,231,0.25)",
  },

  /* ── Component overrides ───────────────────────────────────── */
  components: {
    Button: {
      baseStyle: {
        fontWeight: "600",
        borderRadius: "lg",
        fontFamily: `'DM Sans', 'Manrope', system-ui, sans-serif`,
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
          _focusVisible: { shadow: "0 0 0 3px rgba(32,201,151,0.3)" },
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
          fontFamily: `'Manrope', 'DM Sans', system-ui, sans-serif`,
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
            fontFamily: `'DM Sans', 'Manrope', system-ui, sans-serif`,
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
        bg: "surface.bg",
        color: "text.body",
        fontFamily: `'DM Sans', 'Manrope', system-ui, sans-serif`,
      },
      "h1, h2, h3, h4, h5, h6": {
        fontFamily: `'Manrope', 'DM Sans', system-ui, sans-serif`,
      },
    },
  },
});

export default theme;
