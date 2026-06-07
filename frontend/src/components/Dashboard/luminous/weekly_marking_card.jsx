import { Box, Typography } from "@mui/material";

import { lumi, lumiType } from "./tokens";
import { sampleWeeklyMarking } from "./sample_data";

/**
 * "Weekly Marking" progress card. `progress` is a 0–100 percentage; `remaining`
 * is the count surfaced in the helper line.
 */
export default function WeeklyMarkingCard({
  progress = sampleWeeklyMarking.progress,
  remaining = sampleWeeklyMarking.remaining,
}) {
  const pct = Math.max(0, Math.min(100, progress));
  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(to bottom right, ${lumi.color.surfaceContainer}, ${lumi.color.surfaceContainerLow})`,
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: lumi.radius.card,
        p: 2.5,
      }}
    >
      {/* Decorative corner glow */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          right: 0,
          top: 0,
          width: 128,
          height: 128,
          backgroundColor: "rgba(156,202,255,0.05)",
          borderBottomLeftRadius: "9999px",
          pointerEvents: "none",
        }}
      />
      <Typography component="h2" sx={{ ...lumiType.headlineMd, color: lumi.color.onBackground, mb: 2 }}>
        Weekly Marking
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant }}>
            Progress
          </Typography>
          <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurface }}>{pct}%</Typography>
        </Box>
        <Box
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Weekly marking progress"
          sx={{
            height: 8,
            width: "100%",
            backgroundColor: lumi.color.surfaceVariant,
            borderRadius: lumi.radius.pill,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              height: "100%",
              width: `${pct}%`,
              backgroundColor: lumi.color.primary,
              borderRadius: lumi.radius.pill,
              transition: "width .4s ease",
            }}
          />
        </Box>
      </Box>

      <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant }}>
        You have {remaining} assignment{remaining === 1 ? "" : "s"} left to mark this week. Keep it up!
      </Typography>
    </Box>
  );
}
