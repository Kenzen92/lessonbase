import { lumi } from "./tokens";

// Shared token styling for MUI TextField / Select on Luminous surfaces.
// Spread onto a TextField's `sx` for the dark fill + primary focus ring.
export const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: lumi.color.surfaceContainerHigh,
    borderRadius: lumi.radius.md,
    color: lumi.color.onSurface,
    "& fieldset": { borderColor: lumi.color.outlineVariant },
    "&:hover fieldset": { borderColor: lumi.color.outline },
    "&.Mui-focused fieldset": { borderColor: lumi.color.primary, borderWidth: 2 },
  },
  "& .MuiInputLabel-root": { color: lumi.color.onSurfaceVariant, fontFamily: lumi.font.body },
  "& .MuiInputLabel-root.Mui-focused": { color: lumi.color.primary },
  "& .MuiFormHelperText-root": { color: lumi.color.error },
};
