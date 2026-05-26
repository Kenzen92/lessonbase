import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Rating,
  LinearProgress,
  Divider,
  CircularProgress,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import { useNavigate } from "react-router-dom";
import { fetchSessionFeedbackAggregate } from "../../utils/agent";

function ClassFeedbackSummary({ classEventId }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classEventId) return;
    setLoading(true);
    fetchSessionFeedbackAggregate(classEventId, navigate)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [classEventId]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
        <CircularProgress size={24} sx={{ color: "rgba(255,255,255,0.4)" }} />
      </Box>
    );
  }

  if (!data || data.total_responses === 0) {
    return (
      <Typography
        variant="body2"
        sx={{ color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}
      >
        No student feedback submitted yet.
      </Typography>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <Rating
          value={data.average_rating}
          precision={0.1}
          readOnly
          size="large"
          emptyIcon={
            <StarIcon
              style={{ color: "rgba(255,255,255,0.2)" }}
              fontSize="inherit"
            />
          }
        />
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
          {data.average_rating?.toFixed(1)}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "rgba(255,255,255,0.55)", lineHeight: 1 }}
        >
          ({data.total_responses}{" "}
          {data.total_responses === 1 ? "response" : "responses"})
        </Typography>
      </Box>

      <Box sx={{ mb: data.comments.length > 0 ? 3 : 0 }}>
        {[5, 4, 3, 2, 1].map((star) => {
          const count = data.rating_distribution?.[String(star)] ?? 0;
          const pct =
            data.total_responses > 0
              ? (count / data.total_responses) * 100
              : 0;
          return (
            <Box
              key={star}
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
            >
              <Typography
                variant="caption"
                sx={{ width: 12, color: "rgba(255,255,255,0.7)", flexShrink: 0 }}
              >
                {star}
              </Typography>
              <StarIcon sx={{ fontSize: 13, color: "#ffc107", flexShrink: 0 }} />
              <LinearProgress
                variant="determinate"
                value={pct}
                sx={{
                  flexGrow: 1,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: "#ffc107",
                    borderRadius: 4,
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{ width: 18, color: "rgba(255,255,255,0.5)", flexShrink: 0, textAlign: "right" }}
              >
                {count}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {data.comments.length > 0 && (
        <>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 2 }} />
          <Typography
            variant="subtitle2"
            sx={{ mb: 1.5, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}
          >
            Student Comments
          </Typography>
          {data.comments.map((c, i) => (
            <Box
              key={i}
              sx={{
                mb: 1.5,
                p: 1.5,
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: 1,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
              >
                <Rating
                  value={c.rating}
                  readOnly
                  size="small"
                  emptyIcon={
                    <StarIcon
                      style={{ color: "rgba(255,255,255,0.2)" }}
                      fontSize="inherit"
                    />
                  }
                />
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {c.student__first_name} {c.student__last_name}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{ color: "rgba(255,255,255,0.85)" }}
              >
                {c.comment}
              </Typography>
            </Box>
          ))}
        </>
      )}
    </Box>
  );
}

export default ClassFeedbackSummary;
