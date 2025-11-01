// This component renders the details for an instance of a students assignment attempt.
// It will show if this student has submitted any attempt, or not.
// If an attempt exists, there will be a colour coded status representing 3 possible states:
// - submitted but not reviewed
// - reviewed but not accepted (changes requested) (optional score / grade)
// - reviewed and accepted (optional score / grade)
// There is a button to open the review assignment attempt modal (TODO)
import { Box, Typography } from "@mui/material";
import { PrimaryButton } from "../../styles/buttons";
import { useEffect, useState } from "react";
import { fetchAssignmentAttempt } from "../../utils/agent";
import { Navigate, useNavigate } from "react-router-dom";

const StudentAssignmentAttemptCard = ({
  assignment,
  student,
  setCurrentAssignmentAttempt,
  setFeedbackModalOpen,
  onAttemptFetched,
}) => {
  const [assignmentAttempt, setAssignmentAttempt] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (assignment?.id && student?.id) {
      const handleFetchAssignmentAttempt = async () => {
        try {
          const assignmentAttemptDetails = await fetchAssignmentAttempt(
            assignment.id,
            student.id,
            navigate
          );
          setAssignmentAttempt(assignmentAttemptDetails);
          // Pass the attempt back to parent for grouping
          if (onAttemptFetched) {
            onAttemptFetched(assignmentAttemptDetails);
          }
        } catch (error) {
          console.error("Error fetching assignment details:", error);
          // Pass null if no attempt exists
          if (onAttemptFetched) {
            onAttemptFetched(null);
          }
        }
      };
      handleFetchAssignmentAttempt();
    }
  }, [assignment, student]); // Re-run when assignment or student changes

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
              color: assignmentAttempt.graded ? "#4CAF50" : "#FF9800",
              fontWeight: 600,
              fontSize: "0.9rem",
            }}
          >
            {assignmentAttempt.graded ? "✓ Marked" : "⚠ Not marked"}
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
