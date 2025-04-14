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
        } catch (error) {
          console.error("Error fetching assignment details:", error);
        }
      };
      handleFetchAssignmentAttempt();
    }
  }, [assignment, student]); // Re-run when assignment or student changes

  return assignmentAttempt ? (
    <Box>
      <Typography variant="h6" gutterBottom>
        {assignmentAttempt.title}
      </Typography>

      <Box>
        <Typography variant="body1" gutterBottom>
          {assignmentAttempt.graded}
        </Typography>
        <Typography variant="body2" gutterBottom>
          Submission Date:{" "}
          {new Date(assignmentAttempt.submitted_at).toLocaleDateString()}
        </Typography>
        <PrimaryButton
          onClick={() => {
            setCurrentAssignmentAttempt(assignmentAttempt);
            setFeedbackModalOpen(true);
          }}
        >
          Details
        </PrimaryButton>
      </Box>
    </Box>
  ) : (
    <Box sx={{ height: "2rem" }}>
      <Typography sx={{ color: "darkOrange" }}>Not Submitted</Typography>
    </Box>
  );
};

export default StudentAssignmentAttemptCard;
