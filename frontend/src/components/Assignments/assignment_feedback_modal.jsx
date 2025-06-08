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
  TextareaAutosize,
  Divider,
} from "@mui/material";
import {
  fetchStudents,
  fetchSubjects,
  handleCreateAssignment,
} from "../../utils/agent.js";
import { toast } from "react-toastify";
import ClassResources from "../Resources/class_resources";
import inputStyle from "../../styles/input.jsx";
import StudentListCard from "../Students/student_list_card.jsx";
import { fetchFeedback } from "../../utils/agent.js";

function AssignmentFeedbackModal({
  feedbackModelOpen,
  setFeedbackModalOpen,
  currentAssignmentAttempt,
}) {
  const [formData, setFormData] = useState();

  const navigate = useNavigate();

  useEffect(() => {
    console.log('use effect running');
    console.log(currentAssignmentAttempt);
    const fetchData = async () => { 
      const response = await fetchFeedback(currentAssignmentAttempt.id);
      console.log(response);
    };
    fetchData();
  }, [currentAssignmentAttempt]);

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
            width: { xs: "90%", sm: "80%", md: "70%", lg: "60%" },
            color: "#fff",
          }}
        >
          {currentAssignmentAttempt ? (
            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
              <Box sx={{width: '50%', p:1}}>
                <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}>
                  {currentAssignmentAttempt.assignment.title}
                </Typography>
                <StudentListCard
                  key={currentAssignmentAttempt.student.id}
                  student={currentAssignmentAttempt.student}
                  action={"navigate"}
                />
                <ClassResources
                  assignmentId={currentAssignmentAttempt?.id}
                  existing_resources={currentAssignmentAttempt?.submitted_files}
                  handleReloadData={null} //TODO fixme
                />
                <TextareaAutosize
                  aria-label="minimum height"
                  minRows={2}
                  placeholder="No text answer submitted"
                  style={{
                    width: "95%",
                    paddingTop: "8px",
                    paddingBottom: "8px",
                    paddingLeft: "4",
                    paddingRight: "4",
                  }}
                  value={currentAssignmentAttempt.answer_text || ""}
                />
              </Box>

              <Box sx={{width: '50%', p:1}}>
                <Box> 
                  <Divider sx={{ bgcolor: "#666", my: 2 }} />{" "}
                  <Typography>Previous Feedback can be rendered as a tab navigation if it exists.
                    Need to work out how to dynamically set the number of tabs to previous feedback attempts + 1 for the form</Typography>
                  <Divider sx={{ bgcolor: "#666", my: 2 }} />{" "}
                  <Typography>Star Rating</Typography>
                  <Divider sx={{ bgcolor: "#666", my: 2 }} />{" "}
                  <Typography>Feedback text</Typography>
                  <Divider sx={{ bgcolor: "#666", my: 2 }} />{" "}
                  <Typography>Grade / Score </Typography>
                  <Divider sx={{ bgcolor: "#666", my: 2 }} />{" "}
                  <Typography>Accepted / Rejected radio buttons</Typography>
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
              </Box>
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
