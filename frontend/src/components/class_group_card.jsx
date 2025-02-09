import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import ClassEventCard from "./class_event_card";
import { Modal, Box, Typography, Button } from "@mui/material";
import ScheduleClassModal from "./schedule_class_modal";

const ClassGroupCard = ({ data }) => {
  const [error, setError] = useState(null);
  const [previousClass, setPreviousClass] = useState(null);
  const [nextClass, setNextClass] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedClassEvent, setSelectedClassEvent] = useState(null);
  const navigate = useNavigate();

  const handleOpenModal = (event) => {
    setSelectedClassEvent(event);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedClassEvent(null);
  };

  return (
    <Box
      sx={{
        p: 3,
        boxShadow: 3,
        borderRadius: 2,
        maxWidth: "30rem",
        boxShadow: 5,
        border: 2,
        borderColor: "#333",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6">{data.name}</Typography>
        <Typography variant="h6">{data.students}</Typography>
        <Typography variant="h6">{data.code}</Typography>
        <Typography variant="h6">{data.subjects}</Typography>
      </Box>

      <Box
        sx={{
          mt: 2,
          p: 2,
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      ></Box>

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default ClassGroupCard;
