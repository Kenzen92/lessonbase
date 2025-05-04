import React, { useState } from "react";
import { FaClock, FaFile, FaInfoCircle } from "react-icons/fa";
import { Box, Typography, Button, Chip, IconButton } from "@mui/material";
import { motion } from "framer-motion";
import subjectIconMap from "../../utils/icons";

const ClassEventCard = ({ eventData, handleReloadData, handleOpenDetails }) => {
  const startTime = new Date(eventData.start_time);

  const IconComponent = subjectIconMap[eventData.subject.name];
  const formattedTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).format(startTime);

  return (
    <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }}>
      <Box
        sx={{
          boxShadow: 2,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#292929",
          borderRadius: "15px",
          mb: 1,
          p: 1,
          height: "5rem",
          width: "100%",
        }}
      >
        <Chip
          icon={<IconComponent color="#fff" size={20} />}
          label={
            <span
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "inline-block",
                marginTop: "0.5rem",
                maxWidth: "8rem",
              }}
            >
              {eventData.subject.code}
            </span>
          }
          size="medium"
          sx={{
            color: "#fff",
            fontSize: 20,
            mt: "auto",
            mb: "auto",
            height: "2.2rem",
            minWidth: "10rem",
            backgroundColor: eventData.subject.color,
          }}
        />

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 1,
          }}
        >
          <FaClock color="#fff" size={22} />

          <Typography>{formattedTime}</Typography>
        </Box>
        <Typography>{eventData.duration} Minutes</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FaFile color="#fff" size={22} />
          {eventData.resources.length}
        </Box>
        <IconButton
          onClick={() => handleOpenDetails(eventData)}
          aria-label="details"
        >
          <FaInfoCircle color="#fff" />
        </IconButton>
      </Box>
    </motion.div>
  );
};

export default ClassEventCard;
