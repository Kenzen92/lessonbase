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
  Switch,
  FormControlLabel,
} from "@mui/material";
// Assuming you have an API call for submitting feedback
import { handleSubmitAssignmentFeedback } from "../../utils/agent.js";
import { toast } from "react-toastify";
import ClassResources from "../Resources/class_resources";

function AssignmentFeedbackModal({
  feedbackModelOpen,
  setFeedbackModalOpen,
  currentAssignmentAttempt,
  maxAssignmentScore,
  handleReloadData,
}) {
  const [feedbackFormData, setFeedbackFormData] = useState({
    grade: "",
    accepted: false,
    feedbackText: "",
    uploadedFiles: [],
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (currentAssignmentAttempt) {
      setFeedbackFormData({
        grade: currentAssignmentAttempt.grade || "",
        accepted: currentAssignmentAttempt.accepted || false,
        feedbackText: currentAssignmentAttempt.feedback_text || "",
        uploadedFiles: [],
      });
    }
  }, [currentAssignmentAttempt]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFeedbackFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileUpload = (files) => {
    setFeedbackFormData((prevData) => ({
      ...prevData,
      uploadedFiles: files,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const assignmentFeedbackPayload = {
      attempt_id: currentAssignmentAttempt.id,
      grade: feedbackFormData.grade,
      accepted: feedbackFormData.accepted,
      feedback_text: feedbackFormData.feedbackText,
      uploaded_feedback_files: feedbackFormData.uploadedFiles,
    };

    const result = await handleSubmitAssignmentFeedback(
      assignmentFeedbackPayload
    );

    if (result.success) {
      toast.success(result.message);
      setFeedbackModalOpen(false);
      setFeedbackFormData({
        grade: "",
        accepted: false,
        feedbackText: "",
        uploadedFiles: [],
      });
      if (handleReloadData) {
        handleReloadData();
      }
    } else {
      toast.error(result.message);
    }
  };

  return (
    <>
      <Modal
        open={feedbackModelOpen}
        onClose={() => setFeedbackModalOpen(false)}
        aria-labelledby="assignment-feedback-modal"
        aria-describedby="form-to-provide-assignment-feedback"
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box
          sx={{
            bgcolor: "#333",
            padding: 4,
            borderRadius: 2,
            boxShadow: 24,
            width: { xs: "90%", sm: "70%", md: "60%", lg: "50%" },
            maxHeight: "90vh",
            overflowY: "auto",
            color: "#fff",
          }}
        >
          {currentAssignmentAttempt ? (
            <Box>
              <Typography variant="h5" sx={{ mb: 2, textAlign: "center" }}>
                Feedback for: {currentAssignmentAttempt.assignment.title}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ mb: 3, textAlign: "center" }}
              >
                Student: {currentAssignmentAttempt.student.first_name}{" "}
                {currentAssignmentAttempt.student.last_name}
              </Typography>

              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Student's Submission:
              </Typography>
              <Box
                sx={{ mb: 3, border: "1px solid #555", p: 2, borderRadius: 1 }}
              >
                <Typography variant="body2" sx={{ mb: 1 }}>
                  **Submitted Text:**
                </Typography>
                <TextareaAutosize
                  aria-label="student-submitted-text"
                  minRows={3}
                  placeholder="No text answer submitted"
                  style={{
                    width: "95%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #555",
                    backgroundColor: "#444",
                    color: "#eee",
                  }}
                  value={currentAssignmentAttempt.answer_text || ""}
                  readOnly
                />
                <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
                  **Submitted Files:**
                </Typography>
                <ClassResources
                  assignmentId={currentAssignmentAttempt?.id}
                  existing_resources={currentAssignmentAttempt?.submitted_files}
                  handleReloadData={null}
                />
                {currentAssignmentAttempt?.submitted_files.length === 0 && (
                  <Typography variant="body2" color="textSecondary">
                    No files submitted.
                  </Typography>
                )}
              </Box>

              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Provide Feedback:
              </Typography>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={feedbackFormData.accepted}
                          onChange={handleInputChange}
                          name="accepted"
                          color="primary"
                        />
                      }
                      label="Accepted"
                      sx={{ color: "#fff" }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label={`Grade (out of ${
                        currentAssignmentAttempt?.assignment?.max_score || "N/A"
                      })`}
                      type="number"
                      name="grade"
                      value={feedbackFormData.grade}
                      onChange={handleInputChange}
                      fullWidth
                      InputProps={{
                        inputProps: {
                          min: 0,
                          max:
                            currentAssignmentAttempt?.assignment?.max_score ||
                            100,
                        },
                      }}
                      InputLabelProps={{ style: { color: "#fff" } }}
                      sx={{
                        // Corrected class names for TextField
                        "& .MuiOutlinedInputRoot": {
                          "& .MuiOutlinedInputNotchedOutline": {
                            borderColor: "#555",
                          },
                          "&:hover .MuiOutlinedInputNotchedOutline": {
                            borderColor: "#888",
                          },
                          "&.Mui-focused .MuiOutlinedInputNotchedOutline": {
                            borderColor: "#fff",
                          },
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Teacher Feedback"
                      name="feedbackText"
                      value={feedbackFormData.feedbackText}
                      onChange={handleInputChange}
                      multiline
                      rows={4}
                      fullWidth
                      InputLabelProps={{ style: { color: "#fff" } }}
                      sx={{
                        // Corrected class names for TextField
                        "& .MuiOutlinedInputRoot": {
                          "& .MuiOutlinedInputNotchedOutline": {
                            borderColor: "#555",
                          },
                          "&:hover .MuiOutlinedInputNotchedOutline": {
                            borderColor: "#888",
                          },
                          "&.Mui-focused .MuiOutlinedInputNotchedOutline": {
                            borderColor: "#fff",
                          },
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body1" sx={{ mt: 1, mb: 1 }}>
                      Upload Feedback Files (e.g., annotated documents):
                    </Typography>
                    <Box
                      sx={{
                        border: "1px dashed #777",
                        p: 2,
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body2" color="textSecondary">
                        [Your Dropbox Component Here - e.g., for uploading
                        annotated files]
                      </Typography>
                      {feedbackFormData.uploadedFiles.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            Files to upload:
                          </Typography>
                          <ul>
                            {feedbackFormData.uploadedFiles.map(
                              (file, index) => (
                                <li key={index}>{file.name}</li>
                              )
                            )}
                          </ul>
                        </Box>
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={12} sx={{ mt: 3 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                      sx={{
                        py: 1.5,
                      }}
                    >
                      Submit Feedback
                    </Button>
                  </Grid>
                </Grid>
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
