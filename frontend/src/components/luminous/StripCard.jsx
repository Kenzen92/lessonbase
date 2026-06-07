import { Box } from "@mui/material";

import { lumi } from "./tokens";
import { accentColor } from "./shared";

/**
 * Card base with an optional 4px coloured top strip for status/subject
 * categorisation, per the DESIGN.md "Cards" spec. Level-1 surface, hairline
 * border, 16px radius, subtle hover lift. `accent` is an accent key ("primary"
 * | "tertiary" | "amber" | "violet" | "error") or a raw hex via `accentHex`.
 * Set `strip={false}` for a clean, bandless card.
 */
export default function StripCard({
  accent = "primary",
  accentHex,
  strip = true,
  hover = true,
  onClick,
  sx,
  children,
}) {
  const stripColor = accentHex || accentColor(accent).solid;
  return (
    <Box
      onClick={onClick}
      sx={{
        position: "relative",
        backgroundColor: lumi.color.surfaceContainer,
        border: `1px solid ${lumi.color.hairline}`,
        borderRadius: lumi.radius.card,
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        transition: "background-color .2s ease, transform .2s ease",
        ...(hover && {
          "&:hover": {
            backgroundColor: lumi.color.surfaceContainerHigh,
            transform: "translateY(-2px)",
          },
        }),
        ...sx,
      }}
    >
      {strip && (
        <Box
          aria-hidden
          sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: stripColor }}
        />
      )}
      <Box sx={{ p: 2.5, pt: strip ? 3 : 2.5 }}>{children}</Box>
    </Box>
  );
}
