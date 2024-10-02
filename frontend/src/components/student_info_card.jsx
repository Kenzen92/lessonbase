import React, { useState, useEffect } from "react";
import "../styles/StudentInfoCard.css";
import { Link, useNavigate } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import ClassEventCard from "./class_event_card";
import { Modal, Box, Typography } from "@mui/material";
import ScheduleClassModal from "./schedule_class_modal";
const StudentInfoCard = ({ student, chatId }) => {
  const [error, setError] = useState(null);
  const [previousClass, setPreviousClass] = useState(null);
  const [nextClass, setNextClass] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedClassEvent, setSelectedClassEvent] = useState(null);
  const navigate = useNavigate();

  const fetchClassEvents = async () => {
    try {
      const auth = window.sessionStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/class/${student.id}/`,
        {
          method: "GET",
          headers: {
            Authorization: `Token ${auth}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch class events");
      }

      const data = await response.json();
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
      console.log("upcoming class: ", upcomingClass);
      console.log("previous class:", lastClass);
      setPreviousClass(lastClass);
      setNextClass(upcomingClass);
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchClassEvents();
  }, [student.id]);

  // Callback function to force re-render of ClassDashboard after item deletion
  const handleReloadData = () => {
    console.log("Handling");
    // Call fetchClassEvents to fetch updated data
    fetchClassEvents();
  };
  const createChat = async () => {
    try {
      const auth = window.sessionStorage.getItem("token");
      const response = await fetch("http://localhost:8000/chats/", {
        method: "POST",
        headers: {
          Authorization: `Token ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ participants: [student.id] }),
      });

      if (!response.ok) {
        throw new Error("Failed to create chat");
      }

      const data = await response.json();
      navigate(`/chat/${data.id}`);
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

  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    boxShadow: 24,
  };

  return (
    <div className="student-info-card">
      <div className="student-info-card-content">
        <div className="student-info-card-info">
          <div className="username-picture-row">
            <Typography>{student.username}</Typography>
            <Avatar
              alt={student.username}
              src={student.profile_picture}
              className="student-profile-icon"
            >
              {student.username ? student.username[0] : null}
            </Avatar>
            {chatId ? (
              <Link to={`/chat/${chatId}`}>
                <button className="chat-button">Chat</button>
              </Link>
            ) : (
              <button className="chat-button" onClick={createChat}>
                + Chat
              </button>
            )}
          </div>
          <div className="class-info">
            <button
              disabled={!previousClass}
              onClick={() => handleOpenModal(previousClass)}
            >
              Previous Class:{" "}
              {previousClass ? previousClass.subject : "No Previous Class"}
            </button>

            {nextClass ? (
              <button onClick={() => handleOpenModal(nextClass)}>
                Next Class: {nextClass.subject}
              </button>
            ) : (
              <ScheduleClassModal handleReloadData={handleReloadData} />
            )}
          </div>
        </div>
      </div>
      {error && <p>{error}</p>}

      {/* Modal for class event details */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="class-event-modal-title"
        aria-describedby="class-event-modal-description"
      >
        <Box sx={modalStyle}>
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
      </Modal>
    </div>
  );
};

export default StudentInfoCard;
