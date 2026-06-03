import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Chip,
  Link,
} from "@mui/material";
import Dropzone from "../Resources/dropzone";
import { toast } from "react-toastify";
import { FaUpload } from "react-icons/fa";
import { resolveMediaUrl } from "../../utils/media";
import { getToken } from "../../utils/tokenStorage";

const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

export default function StudentAssignmentAttemptForm({ assignment, assignmentAttempt = null, onReload }) {
  const [answerText, setAnswerText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (assignmentAttempt) {
      setAnswerText(assignmentAttempt.answer_text || "");
      setExistingFiles(assignmentAttempt.files || []);
    }
  }, [assignmentAttempt]);

  const isAttemptCompleted =
    assignmentAttempt &&
    assignmentAttempt.status !== "draft" &&
    assignmentAttempt.status !== "returned";

  const handleFileDrop = (files) => {
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (fileToRemove) => {
    setSelectedFiles((prev) => prev.filter((f) => f !== fileToRemove));
  };

  const handleSubmit = async () => {
    if (!assignment?.id) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("answer_text", answerText);
      formData.append("assignment", assignment.id);
      // Fix: use file.name as the filename, not the File object as the key
      selectedFiles.forEach((file) => formData.append("files", file, file.name));

      const res = await fetch(`${BASE_URL}/assignment/${assignment.id}/submissions/`, {
        method: "POST",
        headers: { Authorization: `Token ${getToken()}` },
        body: formData,
      });

      if (res.ok || res.status === 201) {
        toast.success("Submission saved successfully");
        setSelectedFiles([]);
        onReload?.();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || err.detail || "Submission failed");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("An error occurred while submitting");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 2, p: 2, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom sx={{ color: "white" }}>
        {assignmentAttempt ? "Your Submission" : "Submit Assignment"}
      </Typography>

      {/* Submission status */}
      {assignmentAttempt && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ color: "white" }}>
            Status: {assignmentAttempt.status}
          </Typography>
          {assignmentAttempt.submitted_at && (
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
              Submitted: {new Date(assignmentAttempt.submitted_at).toLocaleString()}
            </Typography>
          )}
        </Box>
      )}

      {/* Text answer */}
      <TextField
        label="Your Answer (Optional)"
        multiline
        rows={4}
        fullWidth
        value={answerText}
        onChange={(e) => setAnswerText(e.target.value)}
        margin="normal"
        disabled={isAttemptCompleted}
        sx={{
          "& .MuiOutlinedInput-root": {
            color: "#fff",
            "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
            "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
            "&.Mui-focused fieldset": { borderColor: "#2196F3" },
          },
          "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
        }}
      />

      {/* Existing files */}
      {existingFiles.length === 0 ? (
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", mt: 2 }}>
          No files attached yet.
        </Typography>
      ) : (
        existingFiles.map((resource, i) => (
          <Chip
            key={resource.id ?? i}
            label={
              <Link
                href={resolveMediaUrl(resource.file || resource.file_url)}
                target="_blank"
                rel="noopener noreferrer"
                download={resource.original_name || resource.title}
                sx={{ color: "inherit", textDecoration: "none" }}
              >
                {resource.title || resource.original_name || "File"}
              </Link>
            }
            color="primary"
            sx={{ m: "0.25rem", width: "100%", justifyContent: "space-between" }}
          />
        ))
      )}

      {/* Dropzone — only when submission is editable */}
      {!isAttemptCompleted && (
        <>
          <Box sx={{ mt: 2 }}>
            <Dropzone onDrop={handleFileDrop} />
          </Box>
          {selectedFiles.map((file, i) => (
            <Chip
              key={i}
              label={file.name}
              onDelete={() => handleRemoveFile(file)}
              color="secondary"
              sx={{ m: "0.25rem", width: "100%", justifyContent: "space-between" }}
            />
          ))}
        </>
      )}

      {/* Submit button */}
      <Box sx={{ mt: 2, textAlign: "right" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={isLoading || isAttemptCompleted}
          startIcon={isLoading ? <CircularProgress size={20} /> : <FaUpload />}
        >
          {assignmentAttempt ? "Update Submission" : "Submit"}
        </Button>
      </Box>
    </Box>
  );
}
