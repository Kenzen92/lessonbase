import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Grid,
  Box,
  Typography,
  TextField,
  Button,
  Modal,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
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
      // Check if there's existing feedback
      const existingFeedback = currentAssignmentAttempt.feedback_entries?.[0];

      setFeedbackFormData({
        grade: existingFeedback?.score || "",
        accepted: currentAssignmentAttempt.accepted || false,
        feedbackText: existingFeedback?.text || "",
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

    // Prepare the feedback payload matching the backend Feedback model
    const assignmentFeedbackPayload = {
      assignmentAttempt: currentAssignmentAttempt.id,
      text: feedbackFormData.feedbackText,
      score: feedbackFormData.grade ? parseInt(feedbackFormData.grade) : null,
      accepted: feedbackFormData.accepted,
      graded: true, // Mark as graded when submitting feedback
      // teacher field will be set automatically by the backend
      // submitted_files: feedbackFormData.uploadedFiles, // TODO: Handle file uploads
    };

    try {
      const result = await handleSubmitAssignmentFeedback(
        assignmentFeedbackPayload,
        navigate
      );

      if (result?.success) {
        toast.success(result.message || "Feedback submitted successfully!");
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
        toast.error(result?.message || "Failed to submit feedback");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("An error occurred while submitting feedback");
    }
  };

  return (
    <>
      <Modal
        open={feedbackModelOpen}
        onClose={() => setFeedbackModalOpen(false)}
        aria-labelledby="assignment-feedback-modal"
        aria-describedby="form-to-provide-assignment-feedback"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(4px)",
        }}
      >
        <Box
          sx={{
            background: "linear-gradient(135deg, #10101dff 0%, #0a132bff 100%)",
            padding: 4,
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            width: { xs: "90%", sm: "70%", md: "60%", lg: "50%" },
            maxHeight: "90vh",
            overflowY: "auto",
            color: "#fff",
          }}
        >
          {currentAssignmentAttempt ? (
            <Box>
              {/* Header */}
              <Box
                sx={{
                  mb: 3,
                  pb: 2,
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    mb: 1,
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  Feedback for: {currentAssignmentAttempt.assignment.title}
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                >
                  Student: {currentAssignmentAttempt.student.first_name}{" "}
                  {currentAssignmentAttempt.student.last_name}
                </Typography>
              </Box>

              {/* Student's Submission Section */}
              <Card
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  mb: 3,
                }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Student's Submission:
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1,
                      color: "rgba(255, 255, 255, 0.8)",
                      fontWeight: 600,
                    }}
                  >
                    **Submitted Text:**
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: 1,
                      p: 2,
                      mb: 2,
                      minHeight: "80px",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: currentAssignmentAttempt.answer_text
                          ? "rgba(255, 255, 255, 0.9)"
                          : "rgba(255, 255, 255, 0.5)",
                        fontStyle: currentAssignmentAttempt.answer_text
                          ? "normal"
                          : "italic",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {currentAssignmentAttempt.answer_text ||
                        "No text answer submitted"}
                    </Typography>
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1,
                      color: "rgba(255, 255, 255, 0.8)",
                      fontWeight: 600,
                    }}
                  >
                    **Submitted Files:**
                  </Typography>
                  <ClassResources
                    assignmentId={currentAssignmentAttempt?.id}
                    existing_resources={
                      currentAssignmentAttempt?.submitted_files
                    }
                    handleReloadData={null}
                  />
                  {currentAssignmentAttempt?.submitted_files?.length === 0 && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255, 255, 255, 0.5)",
                        fontStyle: "italic",
                        mt: 1,
                      }}
                    >
                      No files submitted.
                    </Typography>
                  )}
                </CardContent>
              </Card>

              {/* Feedback Form Section */}
              <Card
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Provide Feedback:
                  </Typography>
                  <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
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

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          label={`Grade (out of ${
                            currentAssignmentAttempt?.assignment?.max_score ||
                            "N/A"
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
                                currentAssignmentAttempt?.assignment
                                  ?.max_score || 100,
                            },
                          }}
                          InputLabelProps={{
                            style: { color: "rgba(255, 255, 255, 0.7)" },
                          }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              color: "#fff",
                              "& fieldset": {
                                borderColor: "rgba(255, 255, 255, 0.2)",
                              },
                              "&:hover fieldset": {
                                borderColor: "rgba(255, 255, 255, 0.3)",
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: "#2196F3",
                              },
                            },
                          }}
                        />
                      </Grid>

                      <Grid size={12}>
                        <TextField
                          label="Teacher Feedback"
                          name="feedbackText"
                          value={feedbackFormData.feedbackText}
                          onChange={handleInputChange}
                          multiline
                          rows={4}
                          fullWidth
                          InputLabelProps={{
                            style: { color: "rgba(255, 255, 255, 0.7)" },
                          }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              color: "#fff",
                              "& fieldset": {
                                borderColor: "rgba(255, 255, 255, 0.2)",
                              },
                              "&:hover fieldset": {
                                borderColor: "rgba(255, 255, 255, 0.3)",
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: "#2196F3",
                              },
                            },
                          }}
                        />
                      </Grid>

                      <Grid size={12}>
                        <Typography
                          variant="body1"
                          sx={{
                            mt: 1,
                            mb: 1,
                            color: "rgba(255, 255, 255, 0.8)",
                            fontWeight: 500,
                          }}
                        >
                          Upload Feedback Files (e.g., annotated documents):
                        </Typography>
                        <Box
                          sx={{
                            border: "1px dashed rgba(255, 255, 255, 0.2)",
                            backgroundColor: "rgba(255, 255, 255, 0.03)",
                            p: 2,
                            borderRadius: 1,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              color: "rgba(255, 255, 255, 0.5)",
                              fontStyle: "italic",
                            }}
                          >
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

                      <Grid size={12} sx={{ mt: 2 }}>
                        <Button
                          type="submit"
                          variant="contained"
                          fullWidth
                          sx={{
                            py: 1.5,
                            background:
                              "linear-gradient(135deg, #2196F3 0%, #1976D2 100%)",
                            fontWeight: 600,
                            fontSize: "1rem",
                            "&:hover": {
                              background:
                                "linear-gradient(135deg, #1976D2 0%, #1565C0 100%)",
                            },
                          }}
                        >
                          Submit Feedback
                        </Button>
                      </Grid>
                    </Grid>
                  </form>
                </CardContent>
              </Card>
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
