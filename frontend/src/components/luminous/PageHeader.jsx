import { Box, Typography } from "@mui/material";

import { lumi, lumiType } from "./tokens";
import StatSummary from "./StatSummary";
import PrimaryActionButton from "./PrimaryActionButton";

/**
 * Standard page header for every Luminous content page: a headline + optional
 * subtitle on the left, and an optional stat summary + primary action on the
 * right. `children` renders below the header row for page-specific controls
 * (filter chips, view toggles, etc.).
 *
 * Props:
 *   title     string
 *   subtitle? string
 *   stats?    StatSummary items
 *   action?   { label, icon, onClick } | ReactNode  (omit to hide)
 */
export default function PageHeader({ title, subtitle, stats, action, children }) {
  const actionNode =
    action && !action.label && !action.icon ? (
      action // already a node
    ) : action ? (
      <PrimaryActionButton label={action.label} icon={action.icon} onClick={action.onClick} />
    ) : null;

  return (
    <Box component="header" sx={{ mb: 4 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { md: "flex-start" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography component="h1" sx={{ ...lumiType.headlineLg, color: lumi.color.onBackground }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant, mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {(stats?.length || actionNode) && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: { xs: 2, md: 3 },
            }}
          >
            {stats?.length ? <StatSummary items={stats} /> : null}
            {actionNode}
          </Box>
        )}
      </Box>

      {children && <Box sx={{ mt: 3 }}>{children}</Box>}
    </Box>
  );
}
