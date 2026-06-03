import React, { useState, useEffect } from "react";
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
  CircularProgress,
  Chip,
} from "@mui/material";
import { toast } from "react-toastify";
import { FaFile } from "react-icons/fa";
import AssignmentAttemptFiles from "../Resources/assignment_attempt_files";
import { getToken } from "../../utils/tokenStorage";

const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

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
  });
  const [selectedFeedbackFiles, setSelectedFeedbackFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentAssignmentAttempt) {
      const existingFeedback = currentAssignmentAttempt.feedback;
      setFeedbackFormData({
        grade: existingFeedback?.score ?? "",
        accepted: existingFeedback?.accepted ?? false,
        feedbackText: existingFeedback?.text ?? "",
      });
      setSelectedFeedbackFiles([]);
    }
  }, [currentAssignmentAttempt]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFeedbackFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentAssignmentAttempt?.id) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("text", feedbackFormData.feedbackText);
      if (feedbackFormData.grade !== "") {
        formData.append("score", parseInt(feedbackFormData.grade, 10));
      }
      formData.append("accepted", feedbackFormData.accepted ? "true" : "false");
      selectedFeedbackFiles.forEach((f) => formData.append("files", f, f.name));

      const res = await fetch(
        `${BASE_URL}/submission/${currentAssignmentAttempt.id}/feedback/`,
        {
          method: "PUT",
          headers: { Authorization: `Token ${getToken()}` },
          body: formData,
        }
      );

      if (res.ok) {
        toast.success("Feedback submitted successfully");
        setFeedbackModalOpen(false);
        setSelectedFeedbackFiles([]);
        handleReloadData?.();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || err.detail || "Failed to submit feedback");
      }
    } catch {
      toast.error("An error occurred while submitting feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const submittedFiles = currentAssignmentAttempt?.files ?? [];

  return (
    <Modal
      open={feedbackModelOpen}
      onClose={() => setFeedbackModalOpen(false)}
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
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.1)",
          width: { xs: "90%", sm: "70%", md: "60%", lg: "50%" },
          maxHeight: "90vh",
          overflowY: "auto",
          color: "#fff",
        }}
      >
        {currentAssignmentAttempt ? (
          <Box>
            {/* Header */}
            <Box sx={{ mb: 3, pb: 2, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
                Feedback for: {currentAssignmentAttempt.assignment?.title}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: "rgba(255,255,255,0.7)" }}>
                Student: {currentAssignmentAttempt.student?.first_name}{" "}
                {currentAssignmentAttempt.student?.last_name}
              </Typography>
            </Box>

            {/* Student submission */}
            <Card
              sx={{
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                mb: 3,
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Student&apos;s Submission
                </Typography>

                <Typography
                  variant="subtitle2"
                  sx={{ mb: 0.5, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}
                >
                  Submitted Text
                </Typography>
                <Box
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.1)",
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
                        ? "rgba(255,255,255,0.9)"
                        : "rgba(255,255,255,0.5)",
                      fontStyle: currentAssignmentAttempt.answer_text ? "normal" : "italic",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {currentAssignmentAttempt.answer_text || "No text answer submitted"}
                  </Typography>
                </Box>

                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}
                >
                  Submitted Files
                </Typography>
                <AssignmentAttemptFiles files={submittedFiles} />
              </CardContent>
            </Card>

            {/* Feedback form */}
            <Card
              sx={{
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Provide Feedback
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
                        label={`Grade (out of ${maxAssignmentScore ?? "N/A"})`}
                        type="number"
                        name="grade"
                        value={feedbackFormData.grade}
                        onChange={handleInputChange}
                        fullWidth
                        InputProps={{
                          inputProps: { min: 0, max: maxAssignmentScore ?? 100 },
                        }}
                        InputLabelProps={{ style: { color: "rgba(255,255,255,0.7)" } }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            color: "#fff",
                            "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                            "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                            "&.Mui-focused fieldset": { borderColor: "#2196F3" },
                          },
                        }}
                      />
                    </Grid>

                    <Grid size={12}>
                      <TextField
                        label="Feedback text"
                        name="feedbackText"
                        value={feedbackFormData.feedbackText}
                        onChange={handleInputChange}
                        multiline
                        rows={4}
                        fullWidth
                        InputLabelProps={{ style: { color: "rgba(255,255,255,0.7)" } }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            color: "#fff",
                            "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                            "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                            "&.Mui-focused fieldset": { borderColor: "#2196F3" },
                          },
                        }}
                      />
                    </Grid>

                    {/* Feedback file upload */}
                    <Grid size={12}>
                      <Typography
                        variant="body2"
                        sx={{ mb: 1, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}
                      >
                        Attach files (e.g. annotated documents)
                      </Typography>
                      <input
                        type="file"
                        multiple
                        style={{ color: "#fff" }}
                        onChange={(e) =>
                          setSelectedFeedbackFiles((prev) => [
                            ...prev,
                            ...Array.from(e.target.files),
                          ])
                        }
                      />
                      {selectedFeedbackFiles.map((f, i) => (
                        <Chip
                          key={i}
                          icon={<FaFile size={12} />}
                          label={f.name}
                          onDelete={() =>
                            setSelectedFeedbackFiles((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            )
                          }
                          color="secondary"
                          sx={{ m: "0.25rem", display: "flex", justifyContent: "space-between" }}
                        />
                      ))}
                    </Grid>

                    <Grid size={12} sx={{ mt: 2 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={submitting}
                        startIcon={submitting ? <CircularProgress size={18} /> : null}
                        sx={{
                          py: 1.5,
                          background: "linear-gradient(135deg, #2196F3 0%, #1976D2 100%)",
                          fontWeight: 600,
                          fontSize: "1rem",
                          "&:hover": {
                            background: "linear-gradient(135deg, #1976D2 0%, #1565C0 100%)",
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
          <Typography>No submission selected</Typography>
        )}
      </Box>
    </Modal>
  );
}

export default AssignmentFeedbackModal;
