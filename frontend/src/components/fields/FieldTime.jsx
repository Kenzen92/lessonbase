import React from "react";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";

/**
 * Themed time picker. Same contract and slot-API wiring as <FieldDate>.
 */
const FieldTime = React.forwardRef(function FieldTime(
  { label, error = false, helperText, hint, required = false, slotProps, ...props },
  ref
) {
  return (
    <TimePicker
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

export default FieldTime;
