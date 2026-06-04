import React from "react";
import FieldText from "./FieldText";

/**
 * Themed numeric input. Same contract as <FieldText> with type="number" and
 * numeric input affordances. `min` / `max` are forwarded to the underlying
 * input so the browser exposes the valid range (validation messages still come
 * from the form schema via `error` / `helperText`).
 */
const FieldNumber = React.forwardRef(function FieldNumber(
  { min, max, step, slotProps, ...props },
  ref
) {
  return (
    <FieldText
      ref={ref}
      type="number"
      inputMode="numeric"
      slotProps={{
        ...slotProps,
        htmlInput: { min, max, step, ...(slotProps?.htmlInput || {}) },
      }}
      {...props}
    />
  );
});

export default FieldNumber;
