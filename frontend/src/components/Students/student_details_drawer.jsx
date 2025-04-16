import React, { useState, useEffect } from "react";
import {
  Box,
  List,
  Divider,
  Typography,
  Button,
  Drawer,
  Avatar,
} from "@mui/material";
import { fetchClassEventsForStudent } from "../../utils/agent";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { handleDeleteStudent } from "../../utils/agent";
import { createChat } from "../../utils/agent";


  export default function StudentDetailsDrawer({
    student,
    open,
    onClose,
    fetchData,
    setChatId,
    setChatOpen,
    setDrawerOpen,
    chats
  }) {
    const navigate = useNavigate();
    const [state, setState] = useState(null);
    const [error, setError] = useState(null);
    const [previousClass, setPreviousClass] = useState(null);
    const [nextClass, setNextClass] = useState(null);
    const [chatId, setChatIdState] = useState(null);

    useEffect(() => {
      if (student) {
        const chat = chats.find((chat) =>
          chat.participants.includes(student.id)
      );
      const resolvedChatId = chat ? chat.id : null;
      setChatIdState(resolvedChatId);
    }
  }, [student]);

  const handleNavigateToClass = (classId) => {
    navigate(`/dashboard/${classId}`);
  };

  const handleSelectChat = (chatId) => {
    setChatId(chatId);
    setDrawerOpen(false);
    setChatOpen(true);
  };

  const handleCreateChat = async () => {
    try {
      const response = await createChat(student.id, navigate);

      if (!response.ok) {
        throw new Error("Failed to create chat");
      }

      const data = await response.json();
      handleSelectChat(data.id);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteStudent = async () => {
    try {
      const data = await handleDeleteStudent(student?.id, navigate);
      toast.success(data.message);
      onClose();
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleFetchClassEvents = async () => {
    try {
      const data = await fetchClassEventsForStudent(student?.id, navigate);
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

      // format the start_time into human readable format
      const formatTime = (time) => {
        const date = new Date(time);
        const days = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ][date.getDay()];
        const dayNumber = date.getDate();
        const hours = date.getHours();
        var minutes = date.getMinutes();
        if (minutes == "0") minutes = "00";
        const ampm = hours >= 12 ? "pm" : "am";
        hours >= 12 ? hours - 12 : hours;
        return `${days}, ${dayNumber} ${hours}:${minutes} ${ampm}`;
      };

      lastClass && (lastClass.start_time = formatTime(lastClass.start_time));
      upcomingClass &&
        (upcomingClass.start_time = formatTime(upcomingClass.start_time));
      setPreviousClass(lastClass);
      setNextClass(upcomingClass);
    } catch (error) {
      console.log(error);
      setError(error.message);
    }
  };

  useEffect(() => {
    if (student && student.id) {
      // Check if student is defined and has an id
      handleFetchClassEvents();
    } else {
      setPreviousClass(null);
      setNextClass(null);
    }
  }, [student, navigate]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ backdropFilter: "blur(2px)" }}
    >
      <Box
        sx={{ width: 500, p: 3, height: "100%", backgroundColor: "#252525" }}
      >
        {student ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "flex-start",
            }}
          >
            <Avatar
              alt={student.first_name}
              src={student.profile_picture}
              sx={{ width: 56, height: 56, mr: 2 }}
            >
              {student.first_name ? student.first_name[0] : null}
            </Avatar>
            <Typography
              variant="h6"
              sx={{ color: "white", mb: 2, textAlign: "center" }}
            >
              {student.first_name} {student.last_name}
            </Typography>
            <Divider sx={{ color: "white" }} />
          </Box>
        ) : (
          <Typography sx={{ color: "white" }}>No Student selected.</Typography>
        )}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <List>
            {previousClass ? (
              <>
                <Typography sx={{ mt: 2, color: "#fff" }}>
                  Previous Class:{" "}
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  sx={{ mt: 2, width: "100%" }}
                  onClick={() => handleNavigateToClass(previousClass.id)}
                >
                  {previousClass.subject.name} {previousClass.start_time}
                </Button>
              </>
            ) : (
              <Typography sx={{ mt: 2, color: "#fff" }}>
                No Previous Class
              </Typography>
            )}
            {nextClass ? (
              <>
                <Typography sx={{ mt: 2, color: "#fff" }}>
                  Next Class:{" "}
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  sx={{ mt: 2, width: "100%" }}
                  onClick={() => handleNavigateToClass(previousClass.id)}
                >
                  {nextClass.subject.name} {nextClass.start_time}
                </Button>
              </>
            ) : (
              <Typography sx={{ mt: 2, color: "#fff" }}>
                No Next Class
              </Typography>
            )}
          </List>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2, width: "100%" }}
            onClick={() => handleDeleteStudent}
          >
            Delete Student
          </Button>
          {chatId ? (
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                console.log("selecting existing chat: ", chatId);
                handleSelectChat(chatId);
              }}
              sx={{ ml: 1, fontSize: "0.8rem" }} // Reduced button size
            >
              Chat
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateChat}
              sx={{ ml: 1, fontSize: "0.8rem" }} // Reduced button size
            >
              + Chat
            </Button>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
