import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import ClassEventCard from "./class_event_card";
import {
  Modal,
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
} from "@mui/material";
import { fetchClassEvents, createChat } from "../utils/agent";
import ScheduleClassModal from "./schedule_class_modal";

const StudentInfoCard = ({ student, chatId, handleSelectChat }) => {
  const [error, setError] = useState(null);
  const [previousClass, setPreviousClass] = useState(null);
  const [nextClass, setNextClass] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedClassEvent, setSelectedClassEvent] = useState(null);
  const navigate = useNavigate();

  const handleFetchClassEvents = async () => {
    try {
      const data = await fetchClassEvents(navigate);
      const now = new Date();

      const pastClasses = data.filter(
        (event) => new Date(event.start_time) < now
      );
      const futureClasses = data.filter(
        (event) => new Date(event.start_time) > now
      );

      const lastClass =
        pastClasses.length > 0 ? pastClasses[pastClasses.length - 1] : null;
      const upcomingClass = futureClasses.length > 0 ? futureClasses[0] : null;
      setPreviousClass(lastClass);
      setNextClass(upcomingClass);
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    handleFetchClassEvents();
  }, [student.id]);

  const handleReloadData = () => {
    handleFetchClassEvents();
  };

  const handleCreateChat = async () => {
    try {
      const response = await createChat(student.id, navigate);

      if (!response.ok) {
        throw new Error("Failed to create chat");
      }

      const data = await response.json();
      handleSelectChat(data.id, student.username);
    } catch (error) {
      setError(error.message);
    }
  };

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
        minHeight: "18rem",
        boxShadow: 5,
        border: 2,
        borderColor: "#333",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Avatar
          alt={student.username}
          src={student.profile_picture}
          sx={{ width: 56, height: 56, mr: 2 }}
        >
          {student.username ? student.username[0] : null}
        </Avatar>
        <Typography variant="h6">{student.username}</Typography>
        <Box sx={{ ml: "auto" }}>
          {chatId ? (
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                console.log("selecting existing chat: ", chatId),
                  handleSelectChat(chatId, student.username);
              }}
              sx={{ ml: 2 }}
            >
              Chat
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateChat}
              sx={{ ml: 2 }}
            >
              + Chat
            </Button>
          )}
        </Box>
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
      >
        <Button
          variant="contained"
          disabled={!previousClass}
          onClick={() => handleOpenModal(previousClass)}
        >
          {previousClass
            ? `Previous Class:  ${previousClass.subject}`
            : "No Previous Class"}
        </Button>

        {nextClass ? (
          <Button
            variant="contained"
            onClick={() => handleOpenModal(nextClass)}
          >
            Next Class: {nextClass.subject}
          </Button>
        ) : (
          <ScheduleClassModal handleReloadData={handleReloadData} />
        )}
      </Box>

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="class-event-modal-title"
        aria-describedby="class-event-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "background.paper",
            p: 3,
            borderRadius: 2,
            boxShadow: 24,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          {selectedClassEvent && (
            <ClassEventCard
              eventData={selectedClassEvent}
              handleReloadData={() => {
                handleCloseModal();
                handleFetchClassEvents();
              }}
            />
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default StudentInfoCard;
