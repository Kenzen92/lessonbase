import { Box } from "@mui/material";

import { lumi } from "./tokens";
import { accentColor, tint } from "./shared";

/**
 * A status pill: tinted background + border with a leading dot, per the design
 * system's status spec. `label` is shown verbatim (e.g. the server category)
 * and `accent` drives the hue. Used by the assignments board, the recent-
 * assignments table, and anywhere a categorical status needs surfacing.
 */
export default function StatusPill({ label, accent }) {
  const a = accentColor(accent);
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.5,
        py: 0.5,
        borderRadius: lumi.radius.pill,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: lumi.font.body,
        border: `1px solid ${tint(a.solid, 0.3)}`,
        backgroundColor: tint(a.solid, 0.1),
        color: a.strong,
        whiteSpace: "nowrap",
      }}
    >
      <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: a.solid }} />
      {label}
    </Box>
  );
}
