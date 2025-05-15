import React from "react";
import { Box, Chip, Typography, Button } from "@mui/material";
import subjectIconMap from "../../utils/icons";
import EventNoteIcon from "@mui/icons-material/EventNote";
import { FaUserGraduate, FaExclamationTriangle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const AssignmentCard = ({
  assignment,
  setDrawerOpen,
  setCurrentAssignment,
}) => {
  const navigate = useNavigate();
  // Add null checks for assignment and its properties for safety
  if (!assignment || !assignment.subject) {
    return null; // Or render a placeholder/error state
  }

  // Use a fallback icon if the subject's icon is not found
  const IconComponent =
    subjectIconMap[assignment.subject.name] || FaUserGraduate;

  const date_today = new Date();
  const dueDateObj = new Date(assignment.due_date);

  // To compare just the dates and ignore the time
  const today_midnight = new Date(
    date_today.getFullYear(),
    date_today.getMonth(),
    date_today.getDate()
  );
  const dueDate_midnight = new Date(
    dueDateObj.getFullYear(),
    dueDateObj.getMonth(),
    dueDateObj.getDate()
  );

  const timeDifference = dueDate_midnight.getTime() - today_midnight.getTime();
  const numDayDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

  const isLate = !assignment.marked && numDayDifference < 0;
  const dueToday = !assignment.marked && numDayDifference === 0;
  // Show days remaining only if not marked and due in the future
  const daysRemaining = !assignment.marked && numDayDifference > 0;

  // Define reusable styles for the Chip label span to handle truncation
  const chipLabelTruncateStyles = {
    "& .MuiChip-label": {
      display: "inline-block",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
  };

  return (
    <Box
      sx={{
        boxShadow: 2,
        p: 1, // Increased padding for better internal spacing
        marginTop: 1,
        borderColor: "#fff",
        borderRadius: "10px",
        borderStyle: "solid",
        borderWidth: 0.1,
        backgroundColor: "#292929",
        transition: "background-color 0.3s ease",
        "&:hover": {
          backgroundColor: "#333",
        },
      }}
    >
      <Typography variant="h6" gutterBottom>
        {assignment.title}
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: 1, // Use gap for consistent spacing between chips
          alignItems: "center", // Vertically align chips
          mb: 2,
          flexWrap: "wrap", // Allow chips to wrap if space is limited
        }}
      >
        {/* Subject Chip */}
        <Chip
          icon={<IconComponent style={{ color: "#fff" }} size={14} />}
          label={assignment.subject.code}
          size="small" // Ensure consistent small size
          sx={{
            ...chipLabelTruncateStyles, // Apply truncation styles
            color: "#fff", // Keep text color white
            backgroundColor: assignment.subject.color,
          }}
        />

        {/* Status Chip (Late or Today) */}
        {isLate || dueToday ? (
          <Chip
            icon={<FaExclamationTriangle style={{ color: "fff" }} size={14} />}
            key={`${assignment.id}-status`} // Added a more specific key for uniqueness
            label={isLate ? "Late" : "Today"}
            color={isLate ? "error" : "warning"}
            size="small" // Ensure consistent small size
            sx={{
              color: "#fff", // Ensure text color is white on colored chips
              // No label truncation needed for these short labels
            }}
          />
        ) : null}

        {/* Days Remaining Chip */}
        {daysRemaining ? (
          <Chip
            icon={<EventNoteIcon style={{ color: "#fff" }} size={14} />}
            label={`${numDayDifference} ${
              numDayDifference === 1 ? "Day" : "Days"
            }`}
            size="small" // Ensure consistent small size
            sx={{
              ...chipLabelTruncateStyles, // Apply truncation styles
              color: "#fff", // Keep text color white
              backgroundColor: "#333",
            }}
          />
        ) : null}
      </Box>
      {/* Centered the button */}
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Button
          variant="contained"
          size="small"
          sx={{ mb: 1 }}
          onClick={() => {
            setCurrentAssignment(assignment);
            navigate(`/assignments/${assignment.id}`);
            setDrawerOpen(true);
          }}
        >
          Details
        </Button>
      </Box>
    </Box>
  );
};

export default AssignmentCard;
