import React, { useState } from "react";
import {
  Box,
  Modal,
  Typography,
  TextField,
  Button,
  Rating,
  CircularProgress,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import { useNavigate } from "react-router-dom";
import { submitSessionFeedback } from "../../utils/agent";
import { toast } from "react-toastify";

function PostClassFeedbackModal({ open, classEventId }) {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSkip = () => navigate("/dashboard");

  const handleSubmit = async () => {
    if (!rating) {
      toast.error("Please select a star rating.");
      return;
    }
    setSubmitting(true);
    try {
      await submitSessionFeedback(classEventId, rating, comment, navigate);
      toast.success("Thanks for your feedback!");
    } catch {
      toast.error("Could not save feedback — heading back to dashboard.");
    } finally {
      navigate("/dashboard");
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleSkip}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      <Box
        data-testid="session-feedback-modal"
        sx={{
          background: "linear-gradient(135deg, #10101dff 0%, #0a132bff 100%)",
          padding: 4,
          borderRadius: 2,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.1)",
          width: { xs: "90%", sm: "480px" },
          color: "#fff",
          outline: "none",
        }}
      >
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
          How was the class?
        </Typography>
        <Typography
          variant="body2"
          sx={{ mb: 3, color: "rgba(255,255,255,0.6)" }}
        >
          Your feedback helps improve future sessions.
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <Rating
            data-testid="session-feedback-rating"
            name="session-rating"
            value={rating}
            onChange={(_, val) => setRating(val)}
            size="large"
            emptyIcon={
              <StarIcon
                style={{ color: "rgba(255,255,255,0.2)" }}
                fontSize="inherit"
              />
            }
          />
        </Box>

        <TextField
          label="Leave a comment (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          multiline
          rows={3}
          fullWidth
          // Put data-testid on the underlying <textarea> so Playwright's .fill()
          // targets an editable element (not the MuiFormControl wrapper div).
          inputProps={{ "data-testid": "session-feedback-comment" }}
          InputLabelProps={{ style: { color: "rgba(255,255,255,0.7)" } }}
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": {
              color: "#fff",
              "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
              "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
              "&.Mui-focused fieldset": { borderColor: "#2196F3" },
            },
          }}
        />

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            data-testid="session-feedback-skip"
            variant="outlined"
            fullWidth
            onClick={handleSkip}
            sx={{
              color: "rgba(255,255,255,0.6)",
              borderColor: "rgba(255,255,255,0.2)",
              "&:hover": { borderColor: "rgba(255,255,255,0.4)" },
            }}
          >
            Skip
          </Button>
          <Button
            data-testid="session-feedback-submit"
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            disabled={submitting || !rating}
            sx={{
              background: "linear-gradient(135deg, #2196F3 0%, #1976D2 100%)",
              fontWeight: 600,
              "&:hover": {
                background: "linear-gradient(135deg, #1976D2 0%, #1565C0 100%)",
              },
              "&.Mui-disabled": { background: "rgba(255,255,255,0.12)" },
            }}
          >
            {submitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Submit"
            )}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

export default PostClassFeedbackModal;
