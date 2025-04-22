import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Link,
} from "@mui/material";
import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone"; // Assuming react-dropzone
import { submitAssignmentAttempt } from "../../utils/agent"; // Your imported API call function
import inputStyle from "../../styles/input";

// Assume navigate is passed as a prop from react-router-dom
export default function StudentAssignmentAttemptForm({
  assignmentAttempt = null,
  navigate, // Assuming navigate is passed as a prop
}) {
  const [answerText, setAnswerText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]); // State for files to be uploaded
  const [existingFilesInfo, setExistingFilesInfo] = useState([]); // State for info about already submitted files
  const [isLoading, setIsLoading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null); // e.g., 'success', 'error'
  const [submissionMessage, setSubmissionMessage] = useState(""); // Message for the status

  // Effect to load existing data if assignmentAttempt is provided
  useEffect(() => {
    if (assignmentAttempt) {
      setAnswerText(assignmentAttempt.answer_text || "");
      // Assuming assignmentAttempt.submitted_files is an array of file info objects
      // like { id, name, url } or similar
      setExistingFilesInfo(assignmentAttempt.submitted_files || []);
    }
  }, [assignmentAttempt]);

  // Determine if the attempt is already submitted/graded to disable inputs
  const isAttemptCompleted =
    assignmentAttempt &&
    (assignmentAttempt.graded || assignmentAttempt.accepted);

  const onDrop = useCallback((acceptedFiles) => {
    // Do something with the files
    setSelectedFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
    console.log("Files selected:", acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleTextChange = (event) => {
    setAnswerText(event.target.value);
  };

  const handleRemoveSelectedFile = (fileToRemove) => {
    setSelectedFiles(selectedFiles.filter((file) => file !== fileToRemove));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setSubmissionStatus(null);
    setSubmissionMessage("");

    const formData = new FormData();

    // Append text answer if not empty
    if (answerText.trim()) {
      formData.append("answer_text", answerText.trim());
    }

    // Append selected files
    selectedFiles.forEach((file) => {
      formData.append("submitted_files", file); // 'submitted_files' should match the serializer field name
    });

    // Check if there's anything to submit
    if (!answerText.trim() && selectedFiles.length === 0) {
      setSubmissionStatus("error");
      setSubmissionMessage("Please provide an answer or upload a file.");
      setIsLoading(false);
      return;
    }

    try {
      // assignmentId is required for the API call structure provided
      if (!assignment.id) {
        throw new Error("Assignment ID is missing.");
      }
      // The API call function signature is submitAssignmentAttempt(assignmentID, data, navigate)
      const result = await submitAssignmentAttempt(
        assignment.id,
        formData,
        navigate
      );

      // Depending on what submitAssignmentAttempt returns:
      if (result && result.success) {
        // Assuming result has a success property
        setSubmissionStatus("success");
        setSubmissionMessage("Assignment submitted successfully!");
        // Optionally clear the form after success
        // setAnswerText('');
        // setSelectedFiles([]);
        // navigate('/some-success-page'); // If navigation is needed after submission
      } else {
        // Handle API specific errors returned in result
        setSubmissionStatus("error");
        setSubmissionMessage(
          result?.message || "Submission failed. Please try again."
        );
        console.error("Submission failed:", result);
      }
    } catch (error) {
      setSubmissionStatus("error");
      setSubmissionMessage(`Submission failed: ${error.message}`);
      console.error("Submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 2, p: 2, border: "1px solid #ccc", borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom sx={{ color: "white" }}>
        {assignmentAttempt ? "Assignment Attempt" : "Submit Assignment"}
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

      {/* File Upload Area */}
      <Box
        {...getRootProps()}
        sx={{
          border: `2px dashed ${isDragActive ? "primary.main" : "#ccc"}`,
          p: 3,
          textAlign: "center",
          cursor: isAttemptCompleted ? "not-allowed" : "pointer",
          mt: 2,
          backgroundColor: isDragActive ? "#e3f2fd" : "transparent",
        }}
      >
        <input {...getInputProps()} disabled={isAttemptCompleted} />{" "}
        {/* Disable if attempt is completed */}
        {isDragActive ? (
          <Typography>Drop the files here ...</Typography>
        ) : (
          <Typography>
            Drag 'n' drop some files here, or click to select files (Optional)
          </Typography>
        )}
      </Box>

      {/* Display selected files to be uploaded */}
      {selectedFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Files to Upload:</Typography>
          <List dense>
            {selectedFiles.map((file, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <Button
                    size="small"
                    onClick={() => handleRemoveSelectedFile(file)}
                    disabled={isAttemptCompleted}
                  >
                    Remove
                  </Button>
                }
              >
                <ListItemText primary={file.name} />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Display existing submitted files */}
      {existingFilesInfo.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Existing Submitted Files:</Typography>
          <List dense>
            {existingFilesInfo.map((fileInfo) => (
              <ListItem key={fileInfo.id}>
                {" "}
                {/* Assuming fileInfo has an id */}
                <ListItemText
                  primary={
                    <Link
                      href={fileInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {fileInfo.name}
                    </Link>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

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

      {/* Submission Status Message */}
      {submissionStatus && (
        <Box sx={{ mt: 2 }}>
          <Typography
            color={
              submissionStatus === "success" ? "success.main" : "error.main"
            }
          >
            {submissionMessage}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
