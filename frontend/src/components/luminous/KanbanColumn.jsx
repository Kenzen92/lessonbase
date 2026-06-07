import { Box, Typography, Tooltip } from "@mui/material";

import { lumi, lumiType, tint } from "./tokens";
import { accentColor } from "./shared";
import EmptyState from "./EmptyState";

/**
 * A single board column: an accent-topped header (title + count) over a
 * scrollable body. Renders an EmptyState when it has no children. `accent` is
 * an accent key driving the header colour; `description` (optional) shows as a
 * header tooltip.
 */
export default function KanbanColumn({
  title,
  accent = "primary",
  count,
  description,
  empty = "Nothing here yet.",
  emptyIcon = "inbox",
  children,
}) {
  const a = accentColor(accent);
  const isEmpty = !children || (Array.isArray(children) && children.filter(Boolean).length === 0);

  const header = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        py: 1.25,
        px: 2,
        borderTop: `3px solid ${a.solid}`,
        borderTopLeftRadius: lumi.radius.md,
        borderTopRightRadius: lumi.radius.md,
        backgroundColor: tint(a.solid, 0.12),
      }}
    >
      <Typography sx={{ ...lumiType.headlineMd, fontSize: "16px", color: a.text }}>
        {title}
      </Typography>
      {count !== undefined && (
        <Box
          component="span"
          sx={{
            ...lumiType.labelMd,
            px: 1,
            py: 0.25,
            borderRadius: lumi.radius.pill,
            backgroundColor: tint(a.solid, 0.18),
            color: a.text,
          }}
        >
          {count}
        </Box>
      )}
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: 240,
        borderRadius: lumi.radius.md,
        backgroundColor: lumi.color.surfaceContainerLow,
        border: `1px solid ${lumi.color.hairline}`,
        overflow: "hidden",
      }}
    >
      {description ? (
        <Tooltip title={description} arrow>
          {header}
        </Tooltip>
      ) : (
        header
      )}

      <Box sx={{ flex: 1, overflowY: "auto", p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {isEmpty ? <EmptyState icon={emptyIcon} message={empty} sx={{ py: 4 }} /> : children}
      </Box>
    </Box>
  );
}
