import { Box, Typography, Button, CircularProgress } from "@mui/material";

import { lumi, lumiType } from "./tokens";
import { SubjectChip, tint } from "./shared";
import StatusPill from "../../luminous/StatusPill";
import { sampleRecentAssignments } from "./sample_data";

const cellSx = {
  ...lumiType.bodyMd,
  color: lumi.color.onSurface,
  px: 2,
  py: 2,
  textAlign: "left",
};

const headSx = {
  ...lumiType.labelMd,
  color: lumi.color.onSurfaceVariant,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  px: 2,
  py: 1.75,
  textAlign: "left",
  fontWeight: 500,
};

/**
 * "Recent Assignments" panel. Rendered as a real <table> for semantics and
 * accessibility; rows highlight on hover and the title turns primary.
 */
export default function RecentAssignments({
  assignments = sampleRecentAssignments,
  loading = false,
  onViewAll,
  onRowClick,
}) {
  return (
    <Box
      component="section"
      sx={{
        backgroundColor: lumi.color.surfaceContainer,
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: lumi.radius.card,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          p: 2.5,
          borderBottom: `1px solid ${lumi.color.outlineVariant}`,
          backgroundColor: tint(lumi.color.surfaceContainerHigh, 0.5),
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography component="h2" sx={{ ...lumiType.headlineMd, color: lumi.color.onBackground }}>
          Recent Assignments
        </Typography>
        <Button
          onClick={onViewAll}
          sx={{
            ...lumiType.labelMd,
            color: lumi.color.primary,
            minWidth: 0,
            "&:hover": { backgroundColor: "rgba(156,202,255,0.08)", color: lumi.color.primaryFixed },
          }}
        >
          View All
        </Button>
      </Box>

      <Box sx={{ overflowX: "auto" }}>
        <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
          <Box component="thead">
            <Box
              component="tr"
              sx={{
                borderBottom: `1px solid ${lumi.color.outlineVariant}`,
                backgroundColor: lumi.color.surfaceContainerLow,
              }}
            >
              <Box component="th" sx={headSx}>Title</Box>
              <Box component="th" sx={headSx}>Subject</Box>
              <Box component="th" sx={headSx}>Due Date</Box>
              <Box component="th" sx={headSx}>Status</Box>
            </Box>
          </Box>
          <Box component="tbody">
            {loading ? (
              <Box component="tr">
                <Box component="td" colSpan={4} sx={{ ...cellSx, textAlign: "center", py: 5 }}>
                  <CircularProgress size={24} sx={{ color: lumi.color.primary }} />
                </Box>
              </Box>
            ) : assignments.length === 0 ? (
              <Box component="tr">
                <Box
                  component="td"
                  colSpan={4}
                  sx={{ ...cellSx, color: lumi.color.onSurfaceVariant, textAlign: "center", py: 5 }}
                >
                  No recent assignments.
                </Box>
              </Box>
            ) : (
              assignments.map((row, i) => (
                <Box
                  component="tr"
                  key={row.id}
                  onClick={() => onRowClick && onRowClick(row)}
                  sx={{
                    borderBottom:
                      i < assignments.length - 1 ? `1px solid ${tint("#3f4752", 0.5)}` : "none",
                    transition: "background-color .15s ease",
                    cursor: onRowClick ? "pointer" : "default",
                    "&:hover": { backgroundColor: tint(lumi.color.surfaceVariant, 0.3) },
                    "&:hover .lumi-assignment-title": { color: lumi.color.primary },
                  }}
                >
                  <Box
                    component="td"
                    sx={{ ...cellSx, fontWeight: 600 }}
                    className="lumi-assignment-title"
                  >
                    <Box component="span" sx={{ transition: "color .15s ease" }}>
                      {row.title}
                    </Box>
                  </Box>
                  <Box component="td" sx={cellSx}>
                    <SubjectChip label={row.subject} accent={row.subjectAccent} color={row.subjectColor} />
                  </Box>
                  <Box component="td" sx={{ ...cellSx, color: lumi.color.onSurfaceVariant }}>
                    {row.dueDate}
                  </Box>
                  <Box component="td" sx={cellSx}>
                    <StatusPill label={row.statusLabel} accent={row.statusAccent} />
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
