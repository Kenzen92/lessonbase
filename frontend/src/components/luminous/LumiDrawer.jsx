import { Drawer, Box, Typography, IconButton } from "@mui/material";

import { lumi, lumiType } from "./tokens";
import { LumiIcon } from "./shared";

/**
 * Token-styled right-anchored drawer shell: a Luminous Paper, a sticky header
 * (title + close), a scrollable body, and an optional sticky footer for
 * actions. Replaces the ad-hoc `Drawer` + gradient Box scaffolds across the
 * detail drawers so every drawer shares one frame.
 */
export default function LumiDrawer({ open, onClose, title, subtitle, leading, width = 520, footer, children }) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100%", sm: width },
            maxWidth: "100%",
            backgroundColor: lumi.color.surfaceContainerLow,
            backgroundImage: "none",
            color: lumi.color.onSurface,
            borderLeft: `1px solid ${lumi.color.outlineVariant}`,
          },
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Header */}
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 1,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
            px: 3,
            py: 2,
            backgroundColor: lumi.color.surfaceContainer,
            borderBottom: `1px solid ${lumi.color.outlineVariant}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
            {leading}
            <Box sx={{ minWidth: 0 }}>
              {title && (
                <Typography component="h2" sx={{ ...lumiType.headlineMd, color: lumi.color.onBackground }} noWrap>
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant }} noWrap>
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton
            aria-label="Close"
            onClick={onClose}
            sx={{ color: lumi.color.onSurfaceVariant, "&:hover": { color: lumi.color.onSurface } }}
          >
            <LumiIcon name="close" sx={{ fontSize: 22 }} />
          </IconButton>
        </Box>

        {/* Body */}
        <Box sx={{ flex: 1, overflowY: "auto", px: 3, py: 2.5 }}>{children}</Box>

        {/* Footer */}
        {footer && (
          <Box
            sx={{
              position: "sticky",
              bottom: 0,
              display: "flex",
              gap: 1,
              px: 3,
              py: 2,
              backgroundColor: lumi.color.surfaceContainer,
              borderTop: `1px solid ${lumi.color.outlineVariant}`,
            }}
          >
            {footer}
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
