import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

/* ─── Palette ─────────────────────────────────────────────────────
   Primary:  #30B8E9 (sky blue)
   Accent:   #4C5CB2 (indigo-violet)
   Deep:     #1B2959 (navy)
   Soft:     #A095CF (lavender)
   Wash:     #E1E7F5 (ice-blue)
   Base:     #FFFFFF
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
      600: "#647ABF",
      700: "#4E63A8",
      800: "#3C4D85",
      900: "#2B3761",
    },
    surface: {
      bg: "#F5F7FB",
      card: "#FFFFFF",
      border: "#E1E7F5",
    },
    text: {
      heading: "#1B2959",
      body: "#2D3A5C",
      muted: "#6B7A99",
    },
  },

  /* ── Fonts ─────────────────────────────────────────────────── */
  fonts: {
    heading: `'Plus Jakarta Sans', system-ui, sans-serif`,
    body: `'Inter', system-ui, sans-serif`,
  },

  /* ── Radii ─────────────────────────────────────────────────── */
  radii: {
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "20px",
    "3xl": "24px",
  },

  /* ── Shadows ───────────────────────────────────────────────── */
  shadows: {
    card: "0 1px 3px 0 rgba(27,41,89,0.04), 0 1px 2px -1px rgba(27,41,89,0.03)",
    "card-hover":
      "0 8px 24px -4px rgba(27,41,89,0.08), 0 2px 6px -2px rgba(27,41,89,0.04)",
    sidebar: "2px 0 16px 0 rgba(27,41,89,0.05)",
    soft: "0 2px 8px 0 rgba(27,41,89,0.06)",
    elevated:
      "0 12px 32px -8px rgba(27,41,89,0.12), 0 4px 8px -4px rgba(27,41,89,0.06)",
    "focus-ring": "0 0 0 3px rgba(48,184,233,0.3)",
  },

  /* ── Component overrides ───────────────────────────────────── */
  components: {
    Button: {
      baseStyle: {
        fontWeight: "600",
        borderRadius: "lg",
        fontFamily: `'Inter', system-ui, sans-serif`,
        transition: "all 0.2s ease",
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
          _focusVisible: { shadow: "0 0 0 3px rgba(76,92,178,0.3)" },
        },
        secondary: {
          bg: "white",
          color: "accent.400",
          border: "1px solid",
          borderColor: "surface.border",
          _hover: { bg: "wash.50", borderColor: "brand.200" },
          _active: { bg: "wash.100" },
          _focusVisible: { shadow: "focus-ring" },
        },
        ghost: {
          color: "text.muted",
          _hover: { bg: "surface.bg", color: "brand.400" },
          _active: { bg: "wash.100" },
          _focusVisible: { shadow: "focus-ring" },
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
          bg: "wash.100",
          color: "accent.400",
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
          fontFamily: `'Plus Jakarta Sans', system-ui, sans-serif`,
          fontWeight: "700",
          fontSize: "lg",
          py: 4,
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
            fontSize: "xs",
            color: "text.muted",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: "wider",
            borderColor: "surface.border",
            bg: "surface.bg",
            py: 3,
            fontFamily: `'Inter', system-ui, sans-serif`,
          },
          td: {
            borderColor: "surface.border",
            fontSize: "sm",
            color: "text.body",
            py: 3.5,
          },
          tr: {
            _hover: { bg: "wash.50" },
            transition: "background 0.15s ease",
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
          _hover: { bg: "wash.50" },
          _focus: { bg: "wash.50" },
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
        fontFamily: `'Inter', system-ui, sans-serif`,
      },
      "h1, h2, h3, h4, h5, h6": {
        fontFamily: `'Plus Jakarta Sans', system-ui, sans-serif`,
      },
    },
  },
});

export default theme;
