import React, { useState, useEffect } from "react";
import {
  Grid,
  Box,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Chip,
} from "@mui/material";
import { toast } from "react-toastify";

import AssignmentAttemptFiles from "../Resources/assignment_attempt_files";
import AssignmentFeedbackFiles from "../Resources/assignment_feedback_files";
import Dropzone from "../Resources/dropzone";
import { getToken } from "../../utils/tokenStorage";
import { humanFileSize } from "../../utils/format";
import { extractApiError } from "../../utils/apiError";
import { LumiModal, PrimaryActionButton, fieldSx, LumiIcon, lumi, lumiType } from "../luminous";

const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

const sectionSx = {
  backgroundColor: lumi.color.surfaceContainer,
  border: `1px solid ${lumi.color.hairline}`,
  borderRadius: lumi.radius.card,
  p: 2.5,
  mb: 2.5,
};

function AssignmentFeedbackModal({
  feedbackModelOpen,
  setFeedbackModalOpen,
  currentAssignmentAttempt,
  maxAssignmentScore,
  handleReloadData,
}) {
  const [feedbackFormData, setFeedbackFormData] = useState({ grade: "", accepted: false, feedbackText: "" });
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
    setFeedbackFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!currentAssignmentAttempt?.id) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("text", feedbackFormData.feedbackText);
      if (feedbackFormData.grade !== "") formData.append("score", parseInt(feedbackFormData.grade, 10));
      formData.append("accepted", feedbackFormData.accepted ? "true" : "false");
      selectedFeedbackFiles.forEach((f) => formData.append("files", f, f.name));

      const res = await fetch(`${BASE_URL}/submission/${currentAssignmentAttempt.id}/feedback/`, {
        method: "PUT",
        headers: { Authorization: `Token ${getToken()}` },
        body: formData,
      });

      if (res.ok) {
        toast.success("Feedback submitted successfully");
        setFeedbackModalOpen(false);
        setSelectedFeedbackFiles([]);
        handleReloadData?.();
      } else {
        toast.error(await extractApiError(res, "Failed to submit feedback"));
      }
    } catch {
      toast.error("An error occurred while submitting feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const submittedFiles = currentAssignmentAttempt?.files ?? [];
  const subtitleParts = currentAssignmentAttempt
    ? [
        currentAssignmentAttempt.assignment?.title,
        `${currentAssignmentAttempt.student?.first_name ?? ""} ${currentAssignmentAttempt.student?.last_name ?? ""}`.trim(),
      ].filter(Boolean)
    : [];

  return (
    <LumiModal
      open={feedbackModelOpen}
      onClose={() => setFeedbackModalOpen(false)}
      title="Provide Feedback"
      maxWidth="md"
      actions={
        currentAssignmentAttempt ? (
          <>
            <Button onClick={() => setFeedbackModalOpen(false)} sx={{ color: lumi.color.onSurfaceVariant }}>
              Cancel
            </Button>
            <PrimaryActionButton
              label={submitting ? "Submitting…" : "Submit Feedback"}
              onClick={handleSubmit}
              disabled={submitting}
            />
          </>
        ) : null
      }
    >
      {currentAssignmentAttempt ? (
        <Box>
          {subtitleParts.length > 0 && (
            <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant, mb: 2.5 }}>
              {subtitleParts.join(" · ")}
            </Typography>
          )}

          {/* Student submission */}
          <Box sx={sectionSx}>
            <Typography sx={{ ...lumiType.headlineMd, fontSize: "16px", color: lumi.color.onBackground, mb: 2 }}>
              Student&apos;s Submission
            </Typography>
            <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant, mb: 0.5 }}>
              Submitted Text
            </Typography>
            <Box
              sx={{
                backgroundColor: lumi.color.surfaceContainerLow,
                border: `1px solid ${lumi.color.hairline}`,
                borderRadius: lumi.radius.md,
                p: 2,
                mb: 2,
                minHeight: 80,
              }}
            >
              <Typography
                sx={{
                  ...lumiType.bodyMd,
                  color: currentAssignmentAttempt.answer_text ? lumi.color.onSurface : lumi.color.onSurfaceVariant,
                  fontStyle: currentAssignmentAttempt.answer_text ? "normal" : "italic",
                  whiteSpace: "pre-wrap",
                }}
              >
                {currentAssignmentAttempt.answer_text || "No text answer submitted"}
              </Typography>
            </Box>
            <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant, mb: 1 }}>
              Submitted Files
            </Typography>
            <AssignmentAttemptFiles files={submittedFiles} />
          </Box>

          {/* Feedback form */}
          <Box sx={sectionSx}>
            <Typography sx={{ ...lumiType.headlineMd, fontSize: "16px", color: lumi.color.onBackground, mb: 2 }}>
              Provide Feedback
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch checked={feedbackFormData.accepted} onChange={handleInputChange} name="accepted" />
                  }
                  label="Accepted"
                  sx={{ color: lumi.color.onSurface }}
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
                  InputProps={{ inputProps: { min: 0, max: maxAssignmentScore ?? 100 } }}
                  sx={fieldSx}
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
                  sx={fieldSx}
                />
              </Grid>
              <Grid size={12}>
                {currentAssignmentAttempt.feedback?.files?.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant, mb: 1 }}>
                      Previously Attached
                    </Typography>
                    <AssignmentFeedbackFiles files={currentAssignmentAttempt.feedback.files} />
                    {selectedFeedbackFiles.length > 0 && (
                      <Typography sx={{ ...lumiType.labelMd, color: lumi.color.amberText, mt: 1 }}>
                        Uploading new files will replace the previously attached ones.
                      </Typography>
                    )}
                  </Box>
                )}
                <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant, mb: 1 }}>
                  Attach files (e.g. annotated documents)
                </Typography>
                <Dropzone
                  onDrop={(files) => setSelectedFeedbackFiles((prev) => [...prev, ...files])}
                />
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: selectedFeedbackFiles.length ? 1 : 0 }}>
                  {selectedFeedbackFiles.map((f, i) => (
                    <Chip
                      key={i}
                      icon={<LumiIcon name="file" sx={{ fontSize: 14 }} />}
                      label={`${f.name} · ${humanFileSize(f.size)}`}
                      onDelete={() =>
                        setSelectedFeedbackFiles((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      sx={{
                        color: lumi.color.onSurface,
                        backgroundColor: lumi.color.surfaceContainerHigh,
                        "& .MuiChip-deleteIcon": { color: lumi.color.onSurfaceVariant },
                      }}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      ) : (
        <Typography sx={{ color: lumi.color.onSurfaceVariant }}>No submission selected</Typography>
      )}
    </LumiModal>
  );
}

export default AssignmentFeedbackModal;
