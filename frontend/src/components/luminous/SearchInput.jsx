import { Box, InputBase } from "@mui/material";

import { lumi, lumiType, tint } from "./tokens";
import { LumiIcon } from "./shared";

/**
 * Token-styled search field: leading icon + input, with a primary focus glow
 * per the DESIGN.md "Input Fields" spec. Controlled — pass `value` +
 * `onChange(nextString)`. `onSubmit` fires on Enter for pages that search on
 * the server.
 */
export default function SearchInput({
  placeholder = "Search…",
  value = "",
  onChange,
  onSubmit,
  sx,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.5,
        height: 44,
        width: "100%",
        borderRadius: lumi.radius.md,
        backgroundColor: lumi.color.surfaceContainer,
        border: `1px solid ${lumi.color.outlineVariant}`,
        transition: "border-color .15s ease, box-shadow .15s ease",
        "&:focus-within": {
          borderColor: lumi.color.primary,
          boxShadow: `0 0 0 2px ${tint(lumi.color.primary, 0.25)}`,
        },
        ...sx,
      }}
    >
      <LumiIcon name="search" sx={{ fontSize: 20, color: lumi.color.onSurfaceVariant }} />
      <InputBase
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onSubmit) onSubmit(value);
        }}
        placeholder={placeholder}
        sx={{
          flex: 1,
          color: lumi.color.onSurface,
          ...lumiType.bodyMd,
          "& input::placeholder": { color: lumi.color.onSurfaceVariant, opacity: 1 },
        }}
      />
    </Box>
  );
}
