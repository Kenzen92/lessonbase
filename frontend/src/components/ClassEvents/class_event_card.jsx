import React from "react";
import { FaPlay, FaClock, FaFile, FaInfoCircle, FaUsers } from "react-icons/fa";
import { Box, Typography, Chip, IconButton, Paper } from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import subjectIconMap from "../../utils/icons";

const ClassEventCard = ({ eventData, handleReloadData, handleOpenDetails }) => {
  const navigate = useNavigate();
  const startTime = new Date(eventData.start_time);

  const IconComponent = subjectIconMap[eventData.subject.name];
  const formattedTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).format(startTime);

  return (
    <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }}>
      <Paper
        elevation={3}
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "rgba(38, 38, 38, 0.95)",
          transition: "all 0.3s ease",
          "&:hover": {
            backgroundColor: "rgba(48, 48, 48, 0.95)",
            transform: "translateY(-2px)",
          },
          borderRadius: "16px",
          mb: 2,
          p: 2.5,
          height: "3rem",
          width: "100%",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <Chip
            icon={<IconComponent color="#fff" size={20} />}
            label={eventData.subject.code}
            size="medium"
            sx={{
              color: "#fff",
              fontSize: 16,
              height: "2.4rem",
              minWidth: "8rem",
              backgroundColor: eventData.subject.color,
              "& .MuiChip-label": {
                padding: "0 8px",
              },
            }}
          />
          <Typography
            variant="subtitle1"
            sx={{
              color: "#fff",
              opacity: 0.9,
              fontWeight: 500,
              minWidth: "10rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {eventData.class_name}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FaClock color="#fff" size={20} />
            <Typography sx={{ color: "#fff", opacity: 0.9 }}>
              {formattedTime} ({eventData.duration}m)
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FaUsers color="#fff" size={20} />
            <Typography sx={{ color: "#fff", opacity: 0.9 }}>
              {eventData.students_count || 0}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FaFile color="#fff" size={20} />
            <Typography sx={{ color: "#fff", opacity: 0.9 }}>
              {eventData.resources.length}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              onClick={() => handleOpenDetails(eventData)}
              aria-label="details"
              sx={{
                color: "#fff",
                opacity: 0.9,
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              <FaInfoCircle color="#fff" />
            </IconButton>
            <IconButton
              onClick={() => navigate(`/interactive-classroom/${eventData.id}`)}
              aria-label="start class"
              sx={{
                color: "#fff",
                backgroundColor: "rgba(0, 255, 0, 0.2)",
                opacity: 0.9,
                "&:hover": {
                  backgroundColor: "rgba(0, 255, 0, 0.3)",
                },
              }}
            >
              <FaPlay color="#fff" size={16} />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
};

export default ClassEventCard;
