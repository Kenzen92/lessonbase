import React, { useState } from "react";
import { Box, Chip, Typography, Button } from "@mui/material";
import subjectIconMap from "../../utils/icons";
import EventNoteIcon from "@mui/icons-material/EventNote";

const AssignmentCard = ({
  assignment,
  setDrawerOpen,
  setCurrentAssignment,
}) => {
  const date_today = new Date(); // Get the current date and time
  const IconComponent = subjectIconMap[assignment.subject.name];
  // Convert assignment.due_date to a Date object for reliable comparison
  const dueDateObj = new Date(assignment.due_date);

  // --- Simpler Date Formatting Logic ---
  const formattedDueDate = dueDateObj.toLocaleDateString(undefined, {
    weekday: "long", // e.g., "Tuesday"
    day: "numeric", // e.g., "23"
    month: "long", // e.g., "March"
  });

  // Determine if the assignment is late
  // It's late if it's not marked AND the due date is before today's date/time
  const isLate = !assignment.marked && dueDateObj < date_today;

  return (
    <Box
      sx={{
        boxShadow: 2,
        p: 0.2,
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
          justifyContent: "space-between",
        }}
      >
        <Chip
          icon={<IconComponent color="#fff" size={14} />}
          label={
            <span
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "inline-block",
                marginTop: "0.5rem",
                maxWidth: "8rem",
              }}
            >
              {assignment.subject.name}
            </span>
          }
          size="small"
          sx={{
            color: "#fff",
            fontSize: 12,
            mt: "auto",
            mb: "auto",
            width: 135,
            backgroundColor: assignment.subject.color,
          }}
        />
        {
          isLate ? (
            <Chip
              key={assignment.id} // Chip key probably belongs outside if rendering multiple
              label={"Late"}
              color="error"
              size="small"
              sx={{
                margin: "0.5rem",
                width: 75,
                justifyContent: "center",
              }}
            />
          ) : // Removed debugging Typography elements
          null // Render nothing when not late, or render a different chip/indicator
        }
      </Box>
      <Box>
        {/* --- Dressed-up Due Date --- */}
        <Box
          sx={{
            display: "flex", // Arrange children (label and value) horizontally
            alignItems: "center", // Vertically align them in the middle
            // Add some bottom margin if you want space below this line,
            // replacing the previous Typography's gutterBottom effect
            marginBottom: 1, // Adjust spacing as needed
          }}
        >
          {/* Optional: Add an icon */}
          <EventNoteIcon
            sx={{
              marginRight: 0.5,
              fontSize: "small",
              color: "text.secondary",
            }}
          />

          {/* Label "Due Date:" */}
          <Typography
            variant="caption" // Use a smaller or different variant for the label
            color="text.secondary" // Use a secondary color to make it less prominent
            sx={{ marginRight: 1 }} // Add spacing between the label and the date value
          >
            Due Date:
          </Typography>

          {/* Value (the formatted date) */}
          <Typography variant="body2">
            {" "}
            {/* Or keep 'body1' if preferred */}
            {formattedDueDate}
          </Typography>
        </Box>
        {/* --- End Dressed-up Due Date --- */}

        <Button
          variant="contained"
          size="small"
          sx={{ mb: 1 }}
          onClick={() => {
            setCurrentAssignment(assignment);
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
