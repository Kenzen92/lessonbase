import { Box, Typography } from "@mui/material";

import { lumi, lumiType } from "./tokens";
import { LumiIcon } from "./shared";

/**
 * Centered empty-state: a muted icon over a message. Used for empty lists,
 * boards and search results.
 */
export default function EmptyState({ icon = "inbox", message, sx }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        py: 6,
        px: 2,
        textAlign: "center",
        color: lumi.color.onSurfaceVariant,
        ...sx,
      }}
    >
      <LumiIcon name={icon} sx={{ fontSize: 40, opacity: 0.5 }} />
      <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant }}>
        {message}
      </Typography>
    </Box>
  );
}
