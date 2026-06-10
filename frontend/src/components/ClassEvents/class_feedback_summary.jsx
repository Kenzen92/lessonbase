import { useState, useEffect } from "react";
import { Box, Typography, Rating, LinearProgress, Divider, CircularProgress } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import { useNavigate } from "react-router-dom";

import { fetchSessionFeedbackAggregate } from "../../utils/agent";
import { DrawerEmptyText, lumi, lumiType, tint } from "../luminous";

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
  }, [classEventId, navigate]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
        <CircularProgress size={24} sx={{ color: lumi.color.onSurfaceVariant }} />
      </Box>
    );
  }

  if (!data || data.total_responses === 0) {
    return <DrawerEmptyText>No student feedback submitted yet.</DrawerEmptyText>;
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <Rating
          value={data.average_rating}
          precision={0.1}
          readOnly
          size="large"
          emptyIcon={<StarIcon style={{ color: tint(lumi.color.onSurface, 0.2) }} fontSize="inherit" />}
        />
        <Typography sx={{ ...lumiType.headlineMd, fontSize: "18px", color: lumi.color.onSurface, lineHeight: 1 }}>
          {data.average_rating?.toFixed(1)}
        </Typography>
        <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant, lineHeight: 1 }}>
          ({data.total_responses} {data.total_responses === 1 ? "response" : "responses"})
        </Typography>
      </Box>

      <Box sx={{ mb: data.comments.length > 0 ? 3 : 0 }}>
        {[5, 4, 3, 2, 1].map((star) => {
          const count = data.rating_distribution?.[String(star)] ?? 0;
          const pct = data.total_responses > 0 ? (count / data.total_responses) * 100 : 0;
          return (
            <Box key={star} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <Typography sx={{ ...lumiType.labelMd, width: 12, color: lumi.color.onSurfaceVariant, flexShrink: 0 }}>
                {star}
              </Typography>
              <StarIcon sx={{ fontSize: 13, color: lumi.color.amber, flexShrink: 0 }} />
              <LinearProgress
                variant="determinate"
                value={pct}
                sx={{
                  flexGrow: 1,
                  height: 7,
                  borderRadius: lumi.radius.pill,
                  backgroundColor: lumi.color.surfaceVariant,
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: lumi.color.amber,
                    borderRadius: lumi.radius.pill,
                  },
                }}
              />
              <Typography
                sx={{ ...lumiType.labelMd, width: 18, color: lumi.color.onSurfaceVariant, flexShrink: 0, textAlign: "right" }}
              >
                {count}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {data.comments.length > 0 && (
        <>
          <Divider sx={{ borderColor: lumi.color.hairline, mb: 2 }} />
          <Typography sx={{ ...lumiType.bodyMd, fontWeight: 600, mb: 1.5, color: lumi.color.onSurface }}>
            Student Comments
          </Typography>
          {data.comments.map((c, i) => (
            <Box
              key={i}
              sx={{
                mb: 1.5,
                p: 1.5,
                backgroundColor: lumi.color.surfaceContainerLow,
                borderRadius: lumi.radius.md,
                border: `1px solid ${lumi.color.hairline}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Rating
                  value={c.rating}
                  readOnly
                  size="small"
                  emptyIcon={<StarIcon style={{ color: tint(lumi.color.onSurface, 0.2) }} fontSize="inherit" />}
                />
                <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant }}>
                  {c.student__first_name} {c.student__last_name}
                </Typography>
              </Box>
              <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurface }}>{c.comment}</Typography>
            </Box>
          ))}
        </>
      )}
    </Box>
  );
}

export default ClassFeedbackSummary;
