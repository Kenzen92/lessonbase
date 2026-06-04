import React from "react";
import { TextField } from "@mui/material";

/**
 * Themed single-line text input. A thin wrapper over MUI <TextField> that reads
 * its colours from the theme (no inline hex) and always reserves the helper-text
 * row so the layout doesn't jump when an error appears.
 *
 * Designed to drop into a react-hook-form <Controller> render prop:
 *   <Controller render={({ field, fieldState }) => (
 *     <FieldText {...field} label="Title" required
 *       error={!!fieldState.error} helperText={fieldState.error?.message} />
 *   )} />
 */
const FieldText = React.forwardRef(function FieldText(
  { label, error = false, helperText, hint, required = false, sx, ...props },
  ref
) {
  return (
    <TextField
      inputRef={ref}
      label={label}
      required={required}
      error={!!error}
      // Fall back to the hint, then a non-breaking space, so the row is always
      // present and the field height is stable.
      helperText={helperText || hint || " "}
      fullWidth
      variant="outlined"
      sx={{ mb: 1, ...sx }}
      {...props}
    />
  );
});

export default FieldText;
