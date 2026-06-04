import React from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

/**
 * Themed date picker. Wires error / helper text through the current MUI X slot
 * API (`slotProps.textField`) — never the removed `renderInput` prop — so inline
 * validation renders and the console stays warning-free.
 *
 * Expects a LocalizationProvider somewhere above it (provided by the wizard
 * shell). Binds to react-hook-form via value / onChange on the picker itself.
 */
const FieldDate = React.forwardRef(function FieldDate(
  { label, error = false, helperText, hint, required = false, slotProps, ...props },
  ref
) {
  return (
    <DatePicker
      label={label}
      slotProps={{
        ...slotProps,
        textField: {
          fullWidth: true,
          required,
          error: !!error,
          helperText: helperText || hint || " ",
          inputRef: ref,
          sx: { mb: 1 },
          ...(slotProps?.textField || {}),
        },
      }}
      {...props}
    />
  );
});

export default FieldDate;
