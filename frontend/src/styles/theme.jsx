import { createTheme } from "@mui/material/styles";

// ── Design tokens ────────────────────────────────────────────────────────────
// Single source of truth for the dark surface palette. Components must read
// these via the theme (e.g. theme.palette.surface.input) rather than inlining
// hex, so the look can change in one place and a light mode becomes possible.
const surface = {
  modal: "#1E1E1E", // modal / dialog background
  input: "#2A2A2A", // inputs sit one step lighter than the modal
  inputHover: "#323232",
  menu: "#262626", // dropdown menus
  divider: "rgba(255, 255, 255, 0.1)",
  border: "rgba(255, 255, 255, 0.15)", // resting input border
  borderHover: "rgba(255, 255, 255, 0.3)", // hover input border
};

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#2196F3",
      light: "#64B5F6",
      dark: "#1976D2",
      contrastText: "#fff",
    },
    secondary: {
      main: "#4CAF50",
      light: "#81C784",
      dark: "#388E3C",
      contrastText: "#fff",
    },
    background: {
      default: "#0a0e27",
      paper: "#1e1e2e",
    },
    error: {
      main: "#f44336",
    },
    text: {
      primary: "#fff",
      secondary: "rgba(255, 255, 255, 0.7)",
    },
    // Custom token group consumed across the wizard kit.
    surface,
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: "transparent",
        },
        html: {
          background:
            "linear-gradient(135deg, #050810 0%, #0a0e1a 25%, #0d1222 50%, #0a1929 100%)",
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
          padding: "8px 16px",
          fontWeight: 600,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: ({ theme }) => ({
          "& .MuiOutlinedInput-root": {
            backgroundColor: theme.palette.surface.input,
            "& fieldset": {
              borderColor: theme.palette.surface.border,
            },
            "&:hover fieldset": {
              borderColor: theme.palette.surface.borderHover,
            },
            "&.Mui-focused fieldset": {
              borderColor: theme.palette.primary.main,
            },
            "&.Mui-error fieldset": {
              borderColor: theme.palette.error.main,
            },
          },
        }),
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.surface.input,
        }),
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: ({ theme }) => ({
          "&:hover": {
            backgroundColor: `${theme.palette.primary.main}14`, // ~8% alpha
          },
          "&.Mui-selected": {
            backgroundColor: `${theme.palette.primary.main}29`, // ~16% alpha
          },
        }),
      },
    },
    MuiModal: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(8px)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255, 255, 255, 0.08)",
          color: "#fff",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.12)",
          },
        },
        deleteIcon: {
          color: "rgba(255, 255, 255, 0.5)",
          "&:hover": {
            color: "#fff",
          },
        },
      },
    },
  },
  transitions: {
    easing: {
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
  },
});
