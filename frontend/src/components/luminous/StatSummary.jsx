import { Box, Typography } from "@mui/material";

import { lumi, lumiType } from "./tokens";
import { LumiIcon } from "./shared";

/**
 * Inline row of summary stats — each an icon + bold value + mono label, e.g.
 * "20 Total · 0 Active · 20 Inactive". Replaces the stats half of the legacy
 * `ActionStatisticsBar`. Feed it items derived from the `statistics` context:
 *   items = [{ id, icon, value, label }]
 */
export default function StatSummary({ items = [], sx }) {
  if (!items.length) return null;
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: { xs: 2, md: 3 },
        ...sx,
      }}
    >
      {items.map(({ id, icon, value, label }) => (
        <Box key={id ?? label} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {icon && (
            <LumiIcon name={icon} sx={{ fontSize: 18, color: lumi.color.onSurfaceVariant }} />
          )}
          <Typography component="span" sx={{ display: "inline-flex", alignItems: "baseline", gap: 0.75 }}>
            <Box component="span" sx={{ ...lumiType.bodyMd, fontWeight: 700, color: lumi.color.onSurface }}>
              {value}
            </Box>
            <Box component="span" sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant }}>
              {label}
            </Box>
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
