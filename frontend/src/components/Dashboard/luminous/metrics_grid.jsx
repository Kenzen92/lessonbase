import { Box, Typography } from "@mui/material";

import { lumi, lumiType } from "./tokens";
import { LumiIcon, accentColor, tint } from "./shared";
import { sampleMetrics } from "./sample_data";

function MetricCard({ metric, onClick }) {
  const accent = accentColor(metric.accent);
  return (
    <Box
      onClick={onClick}
      {...(onClick
        ? {
            role: "button",
            tabIndex: 0,
            onKeyDown: (e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            },
          }
        : {})}
      sx={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: lumi.color.surfaceContainer,
        borderRadius: lumi.radius.card,
        p: 2,
        border: "1px solid rgba(255,255,255,0.05)",
        "&:hover .lumi-blob": { backgroundColor: tint(accent.solid, 0.2) },
        ...(onClick && {
          cursor: "pointer",
          "&:hover": { borderColor: tint(accent.solid, 0.4) },
        }),
      }}
    >
      {/* Ambient colour blob */}
      <Box
        className="lumi-blob"
        aria-hidden
        sx={{
          position: "absolute",
          right: -16,
          top: -16,
          width: 96,
          height: 96,
          borderRadius: "50%",
          backgroundColor: tint(accent.solid, 0.1),
          filter: "blur(24px)",
          transition: "background-color .3s ease",
        }}
      />
      <Box sx={{ position: "relative", display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: lumi.radius.md,
            backgroundColor: lumi.color.surfaceVariant,
            color: accent.text,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LumiIcon name={metric.icon} sx={{ fontSize: 20 }} />
        </Box>
        <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant }}>
          {metric.label}
        </Typography>
      </Box>
      <Typography sx={{ ...lumiType.headlineLg, color: lumi.color.onBackground, position: "relative" }}>
        {metric.value}
      </Typography>
      {metric.detail && (
        <Typography
          sx={{
            ...lumiType.labelMd,
            position: "relative",
            mt: 0.5,
            color: metric.detailWarning ? lumi.color.amberText : lumi.color.onSurfaceVariant,
          }}
        >
          {metric.detail}
        </Typography>
      )}
    </Box>
  );
}

export default function MetricsGrid({ metrics = sampleMetrics, onMetricClick }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
        gap: 2,
        mb: 4,
      }}
    >
      {metrics.map((metric) => (
        <MetricCard
          key={metric.id}
          metric={metric}
          onClick={onMetricClick ? () => onMetricClick(metric) : undefined}
        />
      ))}
    </Box>
  );
}
