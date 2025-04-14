// This modal will have two purposes
// First - it displays the content (text or document content) of a student assignment attempt
// Secondly - it provides a form for the teacher to provide (or edit) feedback for this assignment

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Grid,
  Box,
  Typography,
  TextField,
  Button,
  Modal,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import {
  fetchStudents,
  fetchSubjects,
  handleCreateAssignment,
} from "../../utils/agent.js";
import { toast } from "react-toastify";
import inputStyle from "../../styles/input.jsx";

function AssignmentFeedbackModal({
  feedbackModelOpen,
  setFeedbackModalOpen,
  currentAssignmentAttempt,
}) {
  const [formData, setFormData] = useState();

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      console.log("fetching assignment feedback data");
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const assignmentFeedbackData = {};

    const result = await handleSubmitAssignmentFeedback(assignmentFeedbackData);

    if (result.success) {
      toast.success(result.message);
      setIsOpen(false); // Close modal on success
      setFormData({});
    } else {
      toast.error(result.message);
    }
  };

  return (
    <>
      <Modal
        open={feedbackModelOpen}
        onClose={() => setFeedbackModalOpen(false)}
        aria-labelledby="create-assignment-modal"
        aria-describedby="form-to-create-assignment"
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box
          sx={{
            bgcolor: "#333",
            padding: 4,
            borderRadius: 2,
            boxShadow: 24,
            width: { xs: "90%", sm: "70%", md: "50%", lg: "30%" },
            color: "#fff",
          }}
        >
          {currentAssignmentAttempt ? (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}>
                {currentAssignmentAttempt.assignment.title}
              </Typography>
              <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}>
                {currentAssignmentAttempt.student.name}
              </Typography>
              <Typography>File fields here</Typography>

              <Typography>Feedback form here</Typography>
              <form onSubmit={handleSubmit}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{
                    width: {
                      sm: "100%",
                      lg: "50%",
                    },
                  }}
                >
                  Submit
                </Button>
              </form>
            </Box>
          ) : (
            <Box>
              <Typography>No Assignment Attempt Selected</Typography>
            </Box>
          )}
        </Box>
      </Modal>
    </>
  );
}

export default AssignmentFeedbackModal;
