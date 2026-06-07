// Luminous EdTech — design tokens
// Single source of truth for the dashboard look, ported verbatim from the
// Stitch DESIGN.md. Components read from `lumi` rather than inlining hex, so the
// palette can change in one place. These are intentionally scoped to the
// Luminous dashboard and kept separate from the app-wide MUI `darkTheme`.

export const lumi = {
  color: {
    // Surfaces (deep obsidian background, lighter slate for tonal layers)
    background: "#0b1326",
    surface: "#0b1326",
    surfaceContainerLowest: "#060e20",
    surfaceContainerLow: "#131b2e",
    surfaceContainer: "#171f33",
    surfaceContainerHigh: "#222a3d",
    surfaceContainerHighest: "#2d3449",
    surfaceVariant: "#2d3449",

    // Foreground / text
    onSurface: "#dae2fd",
    onBackground: "#dae2fd",
    onSurfaceVariant: "#bfc7d4",

    // Outlines / borders
    outline: "#89919d",
    outlineVariant: "#3f4752",
    hairline: "rgba(255, 255, 255, 0.05)", // the subtle 1px card border (white/5)

    // Primary — Electric Blue
    primary: "#9ccaff",
    onPrimary: "#003256",
    primaryContainer: "#31a4ff",
    onPrimaryContainer: "#00385f",
    primaryFixed: "#d0e4ff",

    // Secondary — used for the active nav pill
    secondaryContainer: "#3e495d",
    onSecondaryContainer: "#aeb9d0",

    // Tertiary — green (success / complete)
    tertiary: "#4edea3",
    onTertiary: "#003824",
    tertiaryContainer: "#00b57d",
    tertiaryFixed: "#6ffbbe",

    // Error
    error: "#ffb4ab",
    errorContainer: "#93000a",
    onErrorContainer: "#ffdad6",

    // Semantic accents (subject + status categories)
    amber: "#F59E0B",
    amberText: "#FBBF24",
    violet: "#8B5CF6",
    violetText: "#A78BFA",
  },

  font: {
    headline: 'Manrope, "Segoe UI", Roboto, sans-serif',
    body: 'Inter, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Roboto Mono", ui-monospace, monospace',
  },

  radius: {
    sm: "0.25rem", // 4px
    md: "0.5rem", // 8px — inputs / buttons
    lg: "0.75rem", // 12px
    card: "1rem", // 16px — cards & panels
    pill: "9999px",
  },
};

// Reusable typography presets (mirrors the DESIGN.md type scale).
export const lumiType = {
  headlineLg: {
    fontFamily: lumi.font.headline,
    fontSize: { xs: "24px", md: "32px" },
    lineHeight: { xs: "32px", md: "40px" },
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },
  headlineMd: {
    fontFamily: lumi.font.headline,
    fontSize: "20px",
    lineHeight: "28px",
    fontWeight: 600,
  },
  bodyMd: {
    fontFamily: lumi.font.body,
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 400,
  },
  labelMd: {
    fontFamily: lumi.font.mono,
    fontSize: "12px",
    lineHeight: "16px",
    fontWeight: 500,
    letterSpacing: "0.02em",
  },
  buttonText: {
    fontFamily: lumi.font.body,
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 600,
    textTransform: "none",
  },
};

// Helper: a translucent tint of a hex colour, e.g. for chip backgrounds.
export const tint = (hex, alpha) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
