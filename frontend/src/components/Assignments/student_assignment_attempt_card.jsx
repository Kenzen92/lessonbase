// This component renders the details for an instance of a student's submission.
// It will show if this student has submitted anything, or not.
// If a submission exists, there will be a colour coded status representing states:
// - submitted but not reviewed
// - graded / returned (marked)
// There is a button to open the review modal.
import { Box, Typography } from "@mui/material";
import { PrimaryButton } from "../../styles/buttons";
import { useEffect, useState } from "react";

const StudentAssignmentAttemptCard = ({
  assignment,
  student,
  setCurrentAssignmentAttempt,
  setFeedbackModalOpen,
  onAttemptFetched,
  attemptData, // Pre-fetched attempt data (null = no submission, undefined = not yet loaded)
}) => {
  const [assignmentAttempt, setAssignmentAttempt] = useState(
    attemptData ?? null
  );

  // Sync local state whenever the parent refreshes the prop
  useEffect(() => {
    setAssignmentAttempt(attemptData ?? null);
  }, [attemptData]);

  const isMarked =
    assignmentAttempt &&
    ["graded", "returned"].includes(assignmentAttempt.status);

  return assignmentAttempt ? (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              color: isMarked ? "#4CAF50" : "#FF9800",
              fontWeight: 600,
              fontSize: "0.9rem",
            }}
          >
            {isMarked ? "✓ Marked" : "⚠ Not marked"}
          </Typography>
          <Typography
            sx={{ color: "rgba(255, 255, 255, 0.6)" }}
            variant="body2"
          >
            Submitted{" "}
            {new Date(assignmentAttempt.submitted_at).toLocaleString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Typography>
        </Box>
        <PrimaryButton
          size="small"
          onClick={() => {
            setCurrentAssignmentAttempt(assignmentAttempt);
            setFeedbackModalOpen(true);
          }}
          sx={{ minWidth: 80 }}
        >
          Open
        </PrimaryButton>
      </Box>
    </Box>
  ) : (
    <Box sx={{ py: 1 }}>
      <Typography
        sx={{ color: "#F44336", fontWeight: 600, fontSize: "0.9rem" }}
      >
        ✗ Not Submitted
      </Typography>
    </Box>
  );
};

export default StudentAssignmentAttemptCard;
