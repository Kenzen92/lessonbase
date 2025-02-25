import React, { useState } from "react";
import {
  FaDna,
  FaAtom,
  FaGlobe,
  FaCalculator,
  FaDesktop,
  FaLandmark,
  FaPalette,
  FaMusic,
  FaBalanceScaleLeft,
  FaBook,
  FaClock,
  FaInfoCircle,
} from "react-icons/fa";
import { Box, Typography, Button, Chip, IconButton } from "@mui/material";
import { motion } from "framer-motion";

const subjectIDMap = {
  Mathematics: 1,
  Physics: 2,
  Chemistry: 3,
  Biology: 4,
  History: 5,
  Literature: 6,
  "Computer Science": 7,
  Art: 8,
  Music: 9,
  Geography: 10,
};

const subjectIconMap = {
  Mathematics: FaCalculator,
  Physics: FaBalanceScaleLeft,
  Chemistry: FaAtom,
  Biology: FaDna,
  History: FaLandmark,
  Literature: FaBook,
  "Computer Science": FaDesktop,
  Art: FaPalette,
  Music: FaMusic,
  Geography: FaGlobe,
};

const ClassEventCard = ({ eventData, handleReloadData, handleOpenDetails }) => {
  const startTime = new Date(eventData.start_time);
  const currentTime = new Date();
  const isPastEvent = startTime < currentTime;
  const subjectName = Object.keys(subjectIDMap).find(
    (key) => subjectIDMap[key] === eventData.subject
  );
  const IconComponent = subjectIconMap[subjectName];

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
          color="success"
          icon={<IconComponent color="#fff" size={20} />}
          label={subjectName}
          sx={{
            color: "#fff",
            fontSize: "smaller",
            mt: "auto",
            mb: "auto",
            height: "2.2rem",
            minWidth: "10rem",
          }}
        />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          <FaClock color="#fff" size={24} />

          <Typography>{formattedTime}</Typography>
        </Box>
        <Typography>{eventData.duration} Minutes</Typography>
        <IconButton
          onClick={() => handleOpenDetails(eventData.id)}
          aria-label="details"
        >
          <FaInfoCircle color="#fff" />
        </IconButton>
      </Box>
    </motion.div>
  );
};

export default ClassEventCard;
