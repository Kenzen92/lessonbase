import { Dialog, DialogContent, DialogActions, Box, Typography, IconButton } from "@mui/material";

import { lumi, lumiType } from "./tokens";
import { LumiIcon } from "./shared";

/**
 * Token-styled dialog shell: a Luminous Paper, a header (title + close), a
 * scrollable body, and an optional actions footer. Keeps callers declarative —
 * pass `title`, `children`, and an `actions` node.
 */
export default function LumiModal({ open, onClose, title, children, actions, maxWidth = "sm", fullWidth = true }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      slotProps={{
        paper: {
          sx: {
            backgroundColor: lumi.color.surfaceContainer,
            border: `1px solid ${lumi.color.outlineVariant}`,
            borderRadius: lumi.radius.card,
            color: lumi.color.onSurface,
            backgroundImage: "none",
          },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          py: 2,
          borderBottom: `1px solid ${lumi.color.outlineVariant}`,
        }}
      >
        <Typography component="h2" sx={{ ...lumiType.headlineMd, color: lumi.color.onBackground }}>
          {title}
        </Typography>
        <IconButton
          aria-label="Close"
          onClick={onClose}
          sx={{ color: lumi.color.onSurfaceVariant, "&:hover": { color: lumi.color.onSurface } }}
        >
          <LumiIcon name="close" sx={{ fontSize: 22 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>{children}</DialogContent>

      {actions && (
        <DialogActions sx={{ px: 3, pb: 3, pt: 0, gap: 1 }}>{actions}</DialogActions>
      )}
    </Dialog>
  );
}
