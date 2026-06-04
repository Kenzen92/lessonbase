import React from "react";
import { TextField, MenuItem } from "@mui/material";

/**
 * Themed single-select. Pass options as `[{ value, label }]` (or provide
 * <MenuItem> children directly). Reserves the helper-text row like the other
 * fields. Set `placeholder` to render a disabled empty first option.
 */
const FieldSelect = React.forwardRef(function FieldSelect(
  {
    label,
    error = false,
    helperText,
    hint,
    required = false,
    options = [],
    placeholder,
    children,
    sx,
    ...props
  },
  ref
) {
  return (
    <TextField
      select
      inputRef={ref}
      label={label}
      required={required}
      error={!!error}
      helperText={helperText || hint || " "}
      fullWidth
      variant="outlined"
      sx={{ mb: 1, ...sx }}
      {...props}
    >
      {placeholder && (
        <MenuItem value="" disabled>
          {placeholder}
        </MenuItem>
      )}
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
      {children}
    </TextField>
  );
});

export default FieldSelect;
