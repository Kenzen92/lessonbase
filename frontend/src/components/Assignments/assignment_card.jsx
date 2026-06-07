import { Box, Typography, Button, LinearProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { lumi, lumiType, tint, SubjectChip, StatusPill, StripCard } from "../luminous";
import { tagList } from "../../utils/tags";

/**
 * Luminous assignment card for the board. A StripCard accented by its column,
 * showing tag chips, a due-status pill (Late / Today / N days), an optional
 * progress bar, and a Details action. Keeps the legacy handler props
 * (`setDrawerOpen`, `setCurrentAssignment`); `accent` is the column's accent.
 */
const AssignmentCard = ({ assignment, setDrawerOpen, setCurrentAssignment }) => {
  const navigate = useNavigate();
  if (!assignment) return null;

  const tags = tagList(assignment);

  // Whole-day difference between today and the due date.
  const today = new Date();
  const due = new Date(assignment.due_date);
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueMid = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const dayDiff = Math.ceil((dueMid.getTime() - todayMid.getTime()) / (1000 * 60 * 60 * 24));

  const isLate = !assignment.marked && dayDiff < 0;
  const dueToday = !assignment.marked && dayDiff === 0;
  const daysRemaining = !assignment.marked && dayDiff > 0;

  const open = () => {
    setCurrentAssignment(assignment);
    navigate(`/assignments/${assignment.id}`);
    setDrawerOpen(true);
  };

  return (
    <StripCard strip={false} onClick={open}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {typeof assignment.progress === "number" && (
          <LinearProgress
            variant="determinate"
            value={assignment.progress}
            sx={{
              height: 4,
              borderRadius: lumi.radius.pill,
              backgroundColor: lumi.color.surfaceVariant,
              "& .MuiLinearProgress-bar": { backgroundColor: lumi.color.primary },
            }}
          />
        )}

        <Typography
          component="h6"
          sx={{ ...lumiType.headlineMd, fontSize: "16px", m: 0, color: lumi.color.onBackground }}
        >
          {assignment.title}
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, alignItems: "center" }}>
          {tags.map((tag, i) => (
            <SubjectChip key={tag.id ?? `${tag.name}-${i}`} label={tag.name} color={tag.color} />
          ))}
          {isLate && <StatusPill label="Late" accent="error" />}
          {dueToday && <StatusPill label="Today" accent="amber" />}
          {daysRemaining && (
            <Box
              component="span"
              sx={{
                ...lumiType.labelMd,
                px: 1.25,
                py: 0.5,
                borderRadius: lumi.radius.pill,
                backgroundColor: tint(lumi.color.outline, 0.15),
                color: lumi.color.onSurfaceVariant,
                whiteSpace: "nowrap",
              }}
            >
              {dayDiff} {dayDiff === 1 ? "day" : "days"}
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
            sx={{
              ...lumiType.buttonText,
              px: 2,
              height: 32,
              borderRadius: lumi.radius.md,
              backgroundColor: lumi.color.primaryContainer,
              color: lumi.color.onSurface,
              "&:hover": { backgroundColor: lumi.color.primaryContainer, filter: "brightness(0.9)" },
            }}
          >
            Details
          </Button>
        </Box>
      </Box>
    </StripCard>
  );
};

export default AssignmentCard;
