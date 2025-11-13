import React, { useState, useEffect } from "react";
import {
  FaPlay,
  FaClock,
  FaFile,
  FaUsers,
  FaCog,
  FaChevronRight,
} from "react-icons/fa";
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Paper,
  Divider,
  Tooltip,
  Button,
} from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import subjectIconMap from "../../utils/icons";

const ClassEventCard = ({ eventData, handleReloadData, handleOpenDetails }) => {
  const navigate = useNavigate();
  const startTime = new Date(eventData.start_time);
  const now = new Date();
  const [timeRemaining, setTimeRemaining] = useState(null);

  const startDate = new Date(
    startTime.getFullYear(),
    startTime.getMonth(),
    startTime.getDate()
  );
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const isFutureClass = startDate > todayDate;

  // Calculate if event is ongoing and time remaining
  const endTime = new Date(startTime.getTime() + eventData.duration * 60000);
  const isOngoing = now >= startTime && now < endTime;

  useEffect(() => {
    if (!isOngoing) {
      setTimeRemaining(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const remaining = endTime - now;

      if (remaining <= 0) {
        setTimeRemaining(null);
        return;
      }

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeRemaining({ minutes, seconds });
    };

    updateCountdown(); // Initial update
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [isOngoing, endTime]);

  const IconComponent = subjectIconMap[eventData.subject.name];
  const formattedTime = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(startTime);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Paper
        elevation={6}
        sx={{
          display: "flex",
          flexDirection: "column",
          p: 2.5,
          mb: 3,
          borderRadius: "20px",
          background: "rgba(40,40,40,0.75)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.1)",
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "translateY(-4px)",
            background: "rgba(55,55,55,0.85)",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Chip
            icon={<IconComponent color="#fff" size={18} />}
            label={eventData.subject.code}
            sx={{
              backgroundColor: eventData.subject.color,
              color: "#fff",
              fontWeight: 600,
              px: 1.5,
              py: 0.5,
              borderRadius: "12px",
            }}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {isOngoing && timeRemaining && (
              <Chip
                icon={<FaClock size={14} color={"white"} />}
                label={`${timeRemaining.minutes}:${String(
                  timeRemaining.seconds
                ).padStart(2, "0")}`}
                sx={{
                  backgroundColor: "rgba(255,165,0,0.25)",
                  color: "#ffa500",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "12px",
                  border: "1px solid rgba(255,165,0,0.4)",
                  animation: "pulse 2s ease-in-out infinite",
                  "@keyframes pulse": {
                    "0%, 100%": { opacity: 1 },
                    "50%": { opacity: 0.7 },
                  },
                }}
              />
            )}
            <Typography sx={{ color: "#bbb", fontSize: "1.1rem" }}>
              {formattedTime} ({eventData.duration}m)
            </Typography>
          </Box>
        </Box>

        {/* Class name */}
        <Typography
          variant="h6"
          sx={{
            color: "#fff",
            fontWeight: 600,
            mb: 1,
            textOverflow: "ellipsis",
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          {eventData.name || "Untitled Class"}
        </Typography>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 1.5 }} />

        {/* Info bar */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FaUsers color="#aaa" />
            <Typography sx={{ color: "#ccc" }}>
              {eventData.students.length || 0}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FaFile color="#aaa" />
            <Typography sx={{ color: "#ccc" }}>
              {eventData.resources.length}
            </Typography>
          </Box>
        </Box>

        {/* Footer actions */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button
            onClick={() => handleOpenDetails(eventData)}
            startIcon={<FaChevronRight color="white" />}
            sx={{
              color: "#fff",
              textTransform: "none",
              fontSize: "0.95rem",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            Details
          </Button>

          <Tooltip
            title={isFutureClass ? "Class not started yet" : "Start class"}
          >
            <IconButton
              onClick={() => navigate(`/interactive-classroom/${eventData.access_token}`)}
              disabled={isFutureClass}
              sx={{
                color: "#fff",
                backgroundColor: "rgba(0,255,0,0.25)",
                opacity: isFutureClass ? 0.4 : 1,
                "&:hover": {
                  backgroundColor: isFutureClass
                    ? "rgba(0,255,0,0.25)"
                    : "rgba(0,255,0,0.4)",
                },
              }}
            >
              <FaPlay size={18} color="white" />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
    </motion.div>
  );
};

export default ClassEventCard;
