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

  //   const fetchClassEvents = async () => {
  //     try {
  //       const auth = window.sessionStorage.getItem("token");
  //       const response = await fetch(
  //         `http://localhost:8000/class/${student.id}/`,
  //         {
  //           method: "GET",
  //           headers: {
  //             Authorization: `Token ${auth}`,
  //             "Content-Type": "application/json",
  //           },
  //         }
  //       );

  //       if (!response.ok) {
  //         throw new Error("Failed to fetch class events");
  //       }

  //       const data = await response.json();
  //       const now = new Date();

  //       const pastClasses = data.filter(
  //         (event) => new Date(event.start_time) < now
  //       );
  //       const futureClasses = data.filter(
  //         (event) => new Date(event.start_time) > now
  //       );

  //       const lastClass =
  //         pastClasses.length > 0 ? pastClasses[pastClasses.length - 1] : null;
  //       const upcomingClass = futureClasses.length > 0 ? futureClasses[0] : null;
  //       setPreviousClass(lastClass);
  //       setNextClass(upcomingClass);
  //     } catch (error) {
  //       setError(error.message);
  //     }
  //   };

  //   useEffect(() => {
  //     fetchClassEvents();
  //   }, [student.id]);

  //   const handleReloadData = () => {
  //     fetchClassEvents();
  //   };

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
      >
        {/* <Button
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
        )} */}
      </Box>

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      {/* <Modal
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
                fetchClassEvents();
              }}
            />
          )}
        </Box>
      </Modal> */}
    </Box>
  );
};

export default ClassGroupCard;
