import { useEffect, useState } from "react";
import { Box, Typography, Button, CircularProgress, Tooltip } from "@mui/material";
import { motion } from "framer-motion";

import { lumi, lumiType, tint } from "./tokens";
import { LumiIcon, SubjectChip, brightenForDark } from "./shared";
import { sampleUpcomingClasses } from "./sample_data";

const HOUR_MS = 60 * 60 * 1000;

// Re-render on a timer so a card sitting on screen flips to "startable" (or
// "in progress") on its own, without the user having to refresh.
function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * Where the event sits relative to now:
 *   "live"      — between start and end (joinable)
 *   "soon"      — starts within the next hour (startable)
 *   "scheduled" — more than an hour away (not yet startable)
 *   "ended"     — already finished
 * Events without timestamps (e.g. sample data) get no start affordance.
 */
function startStatus(event, now) {
  if (typeof event.startMs !== "number") return null;
  const end = typeof event.endMs === "number" ? event.endMs : event.startMs;
  if (now > end) return "ended";
  if (now >= event.startMs) return "live";
  if (event.startMs - now <= HOUR_MS) return "soon";
  return "scheduled";
}

// A tiny count item (icon + number) used in the card footer.
function CountItem({ icon, value, title }) {
  return (
    <Tooltip title={title || ""}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: lumi.color.onSurfaceVariant }}>
        <LumiIcon name={icon} sx={{ fontSize: 18 }} />
        <Box component="span" sx={{ ...lumiType.labelMd }}>
          {value}
        </Box>
      </Box>
    </Tooltip>
  );
}

// Pulsing "In progress" pill shown while the class is live.
function LiveChip() {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.25,
        py: 0.25,
        borderRadius: lumi.radius.pill,
        backgroundColor: tint(lumi.color.tertiary, 0.15),
        border: `1px solid ${tint(lumi.color.tertiary, 0.35)}`,
      }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: lumi.color.tertiary,
          animation: "lumiLivePulse 2s ease-in-out infinite",
          "@keyframes lumiLivePulse": {
            "0%, 100%": { opacity: 1 },
            "50%": { opacity: 0.4 },
          },
        }}
      />
      <Box component="span" sx={{ ...lumiType.labelMd, color: lumi.color.tertiary }}>
        In progress
      </Box>
    </Box>
  );
}

function StartButton({ event, status, onStart }) {
  // No token (sample data / student payload quirk) or already over → nothing.
  if (!event.accessToken || !status || status === "ended") return null;

  const startable = status === "live" || status === "soon";
  return (
    <Tooltip title={startable ? "" : "Available 1 hour before start"}>
      {/* span keeps the tooltip working while the button is disabled */}
      <span>
        <Button
          onClick={() => onStart && onStart(event)}
          disabled={!startable}
          startIcon={<LumiIcon name="play_arrow" sx={{ fontSize: 18 }} />}
          sx={{
            ...lumiType.buttonText,
            px: 2,
            py: 0.5,
            borderRadius: lumi.radius.pill,
            backgroundColor: startable ? lumi.color.tertiary : "transparent",
            color: startable ? lumi.color.onTertiary : lumi.color.onSurfaceVariant,
            border: `1px solid ${startable ? "transparent" : lumi.color.outlineVariant}`,
            transition: "background-color .2s ease, transform .15s ease",
            "&:hover": startable
              ? { backgroundColor: lumi.color.tertiaryFixed, transform: "scale(1.03)" }
              : {},
            "&.Mui-disabled": {
              color: lumi.color.onSurfaceVariant,
              opacity: 0.5,
            },
          }}
        >
          Start
        </Button>
      </span>
    </Tooltip>
  );
}

function ClassCard({ event, now, onDetails, onStart }) {
  const status = startStatus(event, now);
  // Subject hue drives the card's accent strip so a column of cards reads as
  // distinct classes at a glance.
  const accent = brightenForDark(
    event.tags?.[0]?.color || event.subjectColor || lumi.color.primary
  );

  return (
    <Box
      component={motion.article}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      sx={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: lumi.color.surfaceContainer,
        border: `1px solid ${lumi.color.hairline}`,
        borderRadius: lumi.radius.lg,
        p: 2.5,
        pl: 3,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        transition: "background-color .2s ease, border-color .2s ease, transform .2s ease, box-shadow .2s ease",
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          backgroundColor: tint(accent, status === "live" ? 0.9 : 0.55),
        },
        "&:hover": {
          backgroundColor: lumi.color.surfaceContainerHigh,
          borderColor: "rgba(156,202,255,0.18)",
          transform: "translateY(-2px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        },
        "&:hover .lumi-class-title": { color: lumi.color.primary },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75 }}>
            {(event.tags?.length
              ? event.tags
              : [{ id: "subject", label: event.subject, color: event.subjectColor }]
            ).map((tag) => (
              <SubjectChip key={tag.id} label={tag.label} accent={event.subjectAccent} color={tag.color} />
            ))}
            {status === "live" && <LiveChip />}
          </Box>
          <Typography
            component="h3"
            className="lumi-class-title"
            sx={{ ...lumiType.headlineMd, color: lumi.color.onBackground, transition: "color .2s ease" }}
          >
            {event.title}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            color: lumi.color.onSurface,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          <LumiIcon name="schedule" sx={{ fontSize: 16, color: lumi.color.onSurfaceVariant }} />
          <Box component="span" sx={{ ...lumiType.labelMd }}>
            {event.startTime} · {event.durationMins}m
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pt: 2,
          borderTop: `1px solid ${tint(lumi.color.outlineVariant, 0.3)}`,
        }}
      >
        <Box sx={{ display: "flex", gap: 2 }}>
          <CountItem icon="group" value={event.studentCount} title="Students" />
          <CountItem icon="assignment" value={event.assignmentCount} title="Resources" />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
          <StartButton event={event} status={status} onStart={onStart} />
        </Box>
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
  onStart,
}) {
  const now = useNow();

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
              border: `1px solid ${lumi.color.hairline}`,
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
              <ClassCard key={event.id} event={event} now={now} onDetails={onDetails} onStart={onStart} />
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
