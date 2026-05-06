import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Chip,
} from "@mui/material";
import React, { useState, useEffect, useCallback } from "react";
import Dropzone from "../Resources/dropzone";
import { submitAssignmentAttempt } from "../../utils/agent"; // Your imported API call function
import inputStyle from "../../styles/input";
import { FaUpload } from "react-icons/fa";
import { handleDeleteAssignmentFile } from "../../utils/agent";
import { useNavigate } from "react-router-dom";
import { handleSubmitAssignmentFiles } from "../../utils/agent";

// Assume navigate is passed as a prop from react-router-dom
export default function StudentAssignmentAttemptForm({
  assignment,
  assignmentAttempt = null,
}) {
  const navigate = useNavigate();
  const [answerText, setAnswerText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]); // State for files to be uploaded
  const [existingFiles, setExistingFiles] = useState([]); // State for info about already submitted files
  const [isLoading, setIsLoading] = useState(false);

  // Effect to load existing data if assignmentAttempt is provided
  useEffect(() => {
    if (assignmentAttempt) {
      setAnswerText(assignmentAttempt.answer_text || "");
      setExistingFiles(assignmentAttempt.submitted_files || []);
    }
  }, [assignmentAttempt]);

  // Determine if the attempt is already submitted/graded to disable inputs
  const isAttemptCompleted =
    assignmentAttempt &&
    (assignmentAttempt.graded || assignmentAttempt.accepted);

  const handleTextChange = (event) => {
    setAnswerText(event.target.value);
  };

  const handleFileDrop = (files) => {
    setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
  };

  const handleRemoveFile = (fileToRemove) => {
    setSelectedFiles(selectedFiles.filter((file) => file !== fileToRemove));
  };

  const handleDeleteFile = (resourceURL) => {
    const deleteBody = JSON.stringify({ file_url: resourceURL });
    handleDeleteAssignmentFile(deleteBody)
      .then((response) => {
        if (response.ok) {
          toast.success("File deleted successfully");
          handleReloadData();
        } else {
          toast.error("Failed to delete file");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        toast.error("An error occurred while deleting the file");
      });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // assignmentId is required for the API call structure provided
      if (!assignment.id) {
        throw new Error("assignment ID is missing.");
      }
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append(file, file.filename));
      formData.append("answer_text", answerText);
      formData.append("assignment_id", assignment.id);
      // The API call function signature is submitAssignmentAttempt(assignmentID, data, navigate)
      const result = await submitAssignmentAttempt(
        assignment.id,
        formData,
        navigate
      );
      console.log(result);
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 2, p: 2, border: "1px solid #ccc", borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom sx={{ color: "white" }}>
        {assignmentAttempt ? "assignment Attempt" : "Submit assignment"}
      </Typography>

      {/* Display existing attempt status if applicable */}
      {assignmentAttempt && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ color: "white" }}>
            Submission Status:
          </Typography>
          <Typography variant="body2" sx={{ color: "white" }}>
            Submitted At:{" "}
            {new Date(assignmentAttempt.submitted_at).toLocaleString()}
          </Typography>
          <Typography variant="body2" sx={{ color: "white" }}>
            Graded: {assignmentAttempt.graded ? "Yes" : "No"}
          </Typography>
          {assignmentAttempt.graded && (
            <Typography variant="body2" sx={{ color: "white" }}>
              Accepted: {assignmentAttempt.accepted ? "Yes" : "No"}
            </Typography>
          )}
        </Box>
      )}

      {/* Text Answer Input */}
      <TextField
        label="Your Answer (Optional)"
        multiline
        rows={4}
        fullWidth
        value={answerText}
        onChange={handleTextChange}
        margin="normal"
        disabled={isAttemptCompleted} // Disable if attempt is completed
        sx={{ ...inputStyle }}
      />

      {/* DropBox */}
      <Dropzone onDrop={handleFileDrop} />
      {existingFiles.length === 0 ? (
        <Typography variant="body1" color={"#fff"} sx={{ mt: 4 }}>
          No class resources available.
        </Typography>
      ) : (
        existingFiles.map((resource, index) => (
          <Chip
            key={index}
            label={
              <Link
                href={resource.file}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                {resource.name}
              </Link>
            }
            onDelete={() => handleDeleteFile(resource.file)}
            sx={{
              margin: "0.5rem",
              width: "100%",
              justifyContent: "space-between",
            }}
            color="primary"
          />
        ))
      )}
      {selectedFiles.map((file, index) => (
        <Chip
          key={index}
          label={file.name}
          onDelete={() => handleRemoveFile(file)}
          color="secondary"
          sx={{
            margin: "0.5rem",
            width: "100%",
            justifyContent: "space-between",
            color: "secondary",
          }}
        />
      ))}

      {/* Submission Button */}
      <Box sx={{ mt: 2, textAlign: "right" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={isLoading || isAttemptCompleted} // Disable while loading or if attempt is completed
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {assignmentAttempt ? "Update Attempt" : "Submit Attempt"}{" "}
          {/* Button text can change */}
        </Button>
      </Box>
    </Box>
  );
}
