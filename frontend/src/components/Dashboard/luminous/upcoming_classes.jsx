import { Box, Typography, Button, CircularProgress } from "@mui/material";
import { motion } from "framer-motion";

import { lumi, lumiType } from "./tokens";
import { LumiIcon, SubjectChip } from "./shared";
import { sampleUpcomingClasses } from "./sample_data";

// A tiny count item (icon + number) used in the card footer.
function CountItem({ icon, value }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: lumi.color.onSurfaceVariant }}>
      <LumiIcon name={icon} sx={{ fontSize: 18 }} />
      <Box component="span" sx={{ ...lumiType.labelMd }}>
        {value}
      </Box>
    </Box>
  );
}

function ClassCard({ event, onDetails }) {
  return (
    <Box
      component={motion.article}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      sx={{
        backgroundColor: lumi.color.surfaceContainer,
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: lumi.radius.lg,
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        transition: "background-color .2s ease",
        "&:hover": { backgroundColor: lumi.color.surfaceContainerHigh },
        "&:hover .lumi-class-title": { color: lumi.color.primary },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
          <SubjectChip label={event.subject} accent={event.subjectAccent} color={event.subjectColor} />
          <Typography
            component="h3"
            className="lumi-class-title"
            sx={{ ...lumiType.headlineMd, color: lumi.color.onBackground, transition: "color .2s ease" }}
          >
            {event.title}
          </Typography>
        </Box>
        <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurface, whiteSpace: "nowrap" }}>
          {event.startTime} ({event.durationMins}m)
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pt: 2,
          borderTop: `1px solid rgba(63,71,82,0.3)`,
        }}
      >
        <Box sx={{ display: "flex", gap: 2 }}>
          <CountItem icon="group" value={event.studentCount} />
          <CountItem icon="assignment" value={event.assignmentCount} />
        </Box>
        <Button
          onClick={() => onDetails && onDetails(event)}
          endIcon={<LumiIcon name="chevron_right" sx={{ fontSize: 18 }} />}
          sx={{
            ...lumiType.buttonText,
            color: lumi.color.primary,
            minWidth: 0,
            px: 1,
            "&:hover": { backgroundColor: "rgba(156,202,255,0.08)" },
          }}
        >
          Details
        </Button>
      </Box>
    </Box>
  );
}

/**
 * "Upcoming Classes" section: a Previous/Upcoming range toggle plus
 * date-grouped class cards. `range` + `onRangeChange` are lifted so a parent
 * can drive which window of classes is shown.
 */
export default function UpcomingClasses({
  classes = sampleUpcomingClasses,
  range = "upcoming",
  loading = false,
  hasMore = false,
  loadingMore = false,
  onRangeChange,
  onLoadMore,
  onDetails,
}) {
  // Group events by calendar day (stable key), keeping a friendly divider label
  // and preserving the server-provided order.
  const groups = classes.reduce((acc, event) => {
    const key = event.dateKey || event.date;
    if (!acc[key]) acc[key] = { label: event.date, events: [] };
    acc[key].events.push(event);
    return acc;
  }, {});

  const RangeButton = ({ value, children }) => {
    const active = range === value;
    return (
      <Button
        onClick={() => onRangeChange && onRangeChange(value)}
        aria-pressed={active}
        sx={{
          ...lumiType.buttonText,
          px: 2,
          py: 1,
          borderRadius: lumi.radius.md,
          backgroundColor: active ? lumi.color.tertiary : lumi.color.primaryContainer,
          color: active ? lumi.color.onTertiary : lumi.color.onSurface,
          "&:hover": {
            backgroundColor: active ? lumi.color.tertiary : lumi.color.primaryContainer,
            filter: "brightness(0.9)",
          },
        }}
      >
        {children}
      </Button>
    );
  };

  return (
    <Box component="section" sx={{ mb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography component="h2" sx={{ ...lumiType.headlineMd, color: lumi.color.onBackground }}>
          {range === "previous" ? "Previous Classes" : "Upcoming Classes"}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <RangeButton value="previous">Previous</RangeButton>
          <RangeButton value="upcoming">Upcoming</RangeButton>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} sx={{ color: lumi.color.primary }} />
          </Box>
        )}
        {!loading && classes.length === 0 && (
          <Box
            sx={{
              backgroundColor: lumi.color.surfaceContainer,
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: lumi.radius.lg,
              p: 4,
              textAlign: "center",
              ...lumiType.bodyMd,
              color: lumi.color.onSurfaceVariant,
            }}
          >
            {range === "previous" ? "No previous classes." : "No upcoming classes scheduled."}
          </Box>
        )}
        {Object.entries(groups).map(([key, { label, events }]) => (
          <Box key={key} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant, fontWeight: 700 }}>
              {label}
            </Typography>
            {events.map((event) => (
              <ClassCard key={event.id} event={event} onDetails={onDetails} />
            ))}
          </Box>
        ))}

        {!loading && hasMore && (
          <Button
            onClick={() => onLoadMore && onLoadMore()}
            disabled={loadingMore}
            startIcon={
              loadingMore ? (
                <CircularProgress size={16} sx={{ color: "inherit" }} />
              ) : (
                <LumiIcon name="expand_more" sx={{ fontSize: 20 }} />
              )
            }
            sx={{
              ...lumiType.buttonText,
              alignSelf: "center",
              mt: 1,
              px: 3,
              py: 1,
              borderRadius: lumi.radius.md,
              color: lumi.color.onSurface,
              backgroundColor: lumi.color.surfaceContainer,
              border: "1px solid rgba(255,255,255,0.08)",
              "&:hover": { backgroundColor: lumi.color.surfaceContainerHigh },
            }}
          >
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        )}
      </Box>
    </Box>
  );
}
