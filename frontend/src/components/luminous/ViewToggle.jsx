import { Box, IconButton } from "@mui/material";

import { lumi } from "./tokens";
import { LumiIcon } from "./shared";

const OPTIONS = [
  { value: "grid", icon: "grid_view", label: "Grid view" },
  { value: "list", icon: "list_view", label: "List view" },
];

/**
 * Segmented grid/list view toggle. Controlled — `value` is "grid" | "list" and
 * `onChange(next)` reports the selection.
 */
export default function ViewToggle({ value = "grid", onChange }) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        p: 0.5,
        gap: 0.5,
        borderRadius: lumi.radius.md,
        backgroundColor: lumi.color.surfaceContainer,
        border: `1px solid ${lumi.color.outlineVariant}`,
      }}
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <IconButton
            key={opt.value}
            aria-label={opt.label}
            aria-pressed={active}
            onClick={() => onChange && onChange(opt.value)}
            sx={{
              width: 32,
              height: 32,
              borderRadius: lumi.radius.sm,
              color: active ? lumi.color.onSurface : lumi.color.onSurfaceVariant,
              backgroundColor: active ? lumi.color.surfaceContainerHighest : "transparent",
              "&:hover": { backgroundColor: lumi.color.surfaceVariant },
            }}
          >
            <LumiIcon name={opt.icon} sx={{ fontSize: 18 }} />
          </IconButton>
        );
      })}
    </Box>
  );
}
