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
        <Typography sx={{ color: assignmentAttempt.graded ? 'darkGreen' : 'red'}}>{assignmentAttempt.graded ? "Marked" : "Not marked"}</Typography>
        <Typography sx={{ color: 'lightGray'}} variant="body2" gutterBottom>
          Submitted{" "}
          {new Date(assignmentAttempt.submitted_at).toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Typography>
        <PrimaryButton
          onClick={() => {
            setCurrentAssignmentAttempt(assignmentAttempt);
            setFeedbackModalOpen(true);
          }}
        >
          Open
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
