import { useState, useEffect } from "react";
import { Box, TextField, Typography, Chip } from "@mui/material";
import { toast } from "react-toastify";

import Dropzone from "../Resources/dropzone";
import ResourceFileList from "../Resources/resource_file_list";
import { getToken } from "../../utils/tokenStorage";
import { humanFileSize } from "../../utils/format";
import { extractApiError } from "../../utils/apiError";
import { lumi, lumiType, PrimaryActionButton, StatusPill, fieldSx } from "../luminous";

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
        toast.error(await extractApiError(res, "Submission failed"));
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("An error occurred while submitting");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        mt: 2,
        p: 2.5,
        backgroundColor: lumi.color.surfaceContainer,
        border: `1px solid ${lumi.color.hairline}`,
        borderRadius: lumi.radius.card,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 1 }}>
        <Typography sx={{ ...lumiType.headlineMd, fontSize: "16px", color: lumi.color.onBackground }}>
          {assignmentAttempt ? "Your Submission" : "Submit Assignment"}
        </Typography>
        {assignmentAttempt && (
          <StatusPill
            label={assignmentAttempt.status}
            accent={
              { graded: "tertiary", submitted: "primary", draft: "amber", returned: "violet" }[
                assignmentAttempt.status
              ] || "primary"
            }
          />
        )}
      </Box>

      {assignmentAttempt?.submitted_at && (
        <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant, mb: 1.5 }}>
          Submitted {new Date(assignmentAttempt.submitted_at).toLocaleString()}
        </Typography>
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
        sx={fieldSx}
      />

      {/* Existing files */}
      <Box sx={{ mt: 2 }}>
        <ResourceFileList files={existingFiles} emptyMessage="No files attached yet." />
      </Box>

      {/* Dropzone — only when submission is editable */}
      {!isAttemptCompleted && (
        <>
          <Box sx={{ mt: 2 }}>
            <Dropzone onDrop={handleFileDrop} />
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: selectedFiles.length ? 1 : 0 }}>
            {selectedFiles.map((file, i) => (
              <Chip
                key={i}
                label={`${file.name} · ${humanFileSize(file.size)}`}
                onDelete={() => handleRemoveFile(file)}
                sx={{
                  color: lumi.color.onSurface,
                  backgroundColor: lumi.color.surfaceContainerHigh,
                  "& .MuiChip-deleteIcon": { color: lumi.color.onSurfaceVariant },
                }}
              />
            ))}
          </Box>
        </>
      )}

      {/* Submit button */}
      <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
        <PrimaryActionButton
          label={isLoading ? "Submitting…" : assignmentAttempt ? "Update Submission" : "Submit"}
          icon={isLoading ? undefined : "add"}
          onClick={handleSubmit}
          disabled={isLoading || isAttemptCompleted}
        />
      </Box>
    </Box>
  );
}
