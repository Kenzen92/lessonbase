import React from "react";
import { FaPlay, FaClock, FaFile, FaInfoCircle, FaUsers } from "react-icons/fa";
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Paper,
  Divider,
  Tooltip,
} from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import subjectIconMap from "../../utils/icons";

const ClassEventCard = ({ eventData, handleReloadData, handleOpenDetails }) => {
  const navigate = useNavigate();
  const startTime = new Date(eventData.start_time);
  const now = new Date();

  const startDate = new Date(
    startTime.getFullYear(),
    startTime.getMonth(),
    startTime.getDate()
  );
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const isFutureClass = startDate > todayDate;

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
          <Typography sx={{ color: "#bbb", fontSize: "1.1rem" }}>
            {formattedTime} ({eventData.duration}m)
          </Typography>
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
          {eventData.class_group || "Untitled Class"}
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
          <Tooltip title="View class details">
            <IconButton
              onClick={() => handleOpenDetails(eventData)}
              sx={{
                color: "#fff",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
              }}
            >
              <FaInfoCircle color="white" />
            </IconButton>
          </Tooltip>

          <Tooltip
            title={isFutureClass ? "Class not started yet" : "Start class"}
          >
            <IconButton
              onClick={() => navigate(`/interactive-classroom/${eventData.id}`)}
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
