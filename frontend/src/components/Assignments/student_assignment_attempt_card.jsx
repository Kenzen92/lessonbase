// This component renders the details for an instance of a student's submission.
// It will show if this student has submitted anything, or not.
// If a submission exists, there will be a colour coded status representing states:
// - submitted but not reviewed
// - graded / returned (marked)
// There is a button to open the review modal.
import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { lumi, lumiType, PrimaryActionButton } from "../luminous";
import { fetchSubmissionDetails } from "../../utils/agent";

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
  const [opening, setOpening] = useState(false);

  // Sync local state whenever the parent refreshes the prop
  useEffect(() => {
    setAssignmentAttempt(attemptData ?? null);
  }, [attemptData]);

  const isMarked =
    assignmentAttempt &&
    ["graded", "returned"].includes(assignmentAttempt.status);

  // The grouped list is fed by the lightweight submissions list endpoint, so
  // pull the full record (answer text, files, feedback) before opening the
  // review modal.
  const handleOpen = async () => {
    setOpening(true);
    try {
      const details = await fetchSubmissionDetails(assignmentAttempt.id);
      setCurrentAssignmentAttempt(details || assignmentAttempt);
      setFeedbackModalOpen(true);
    } catch {
      toast.error("Could not load the submission");
    } finally {
      setOpening(false);
    }
  };

  return assignmentAttempt ? (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              ...lumiType.bodyMd,
              color: isMarked ? lumi.color.tertiary : lumi.color.amberText,
              fontWeight: 600,
            }}
          >
            {isMarked ? "✓ Marked" : "⚠ Not marked"}
          </Typography>
          <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant }}>
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
        <PrimaryActionButton
          label={opening ? "Opening…" : "Open"}
          onClick={handleOpen}
          disabled={opening}
        />
      </Box>
    </Box>
  ) : (
    <Box sx={{ py: 1 }}>
      <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.error, fontWeight: 600 }}>
        ✗ Not Submitted
      </Typography>
    </Box>
  );
};

export default StudentAssignmentAttemptCard;
