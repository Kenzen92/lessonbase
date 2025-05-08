import React, { useState, useEffect } from "react";
import {
  Box,
  List,
  Divider,
  Typography,
  Button,
  Drawer,
  Avatar,
  Chip,
} from "@mui/material";
import { fetchClassEventsForStudent } from "../../utils/agent";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { handleDeleteStudent } from "../../utils/agent";
import { createChat } from "../../utils/agent";
import {
  PrimaryButton,
  SecondaryButton,
  WarningButton,
} from "../../styles/buttons";
import ClassGroupChip from "../ClassGroups/class_group_chip";

export default function StudentDetailsDrawer({
  student,
  open,
  onClose,
  fetchData,
  setChatId,
  setChatOpen,
  setDrawerOpen,
  chats,
}) {
  const navigate = useNavigate();
  const [previousClass, setPreviousClass] = useState(null);
  const [nextClass, setNextClass] = useState(null);
  const [chatId, setChatIdState] = useState(null);
  // Added error state for potential API call issues
  const [error, setError] = useState(null);

  useEffect(() => {
    if (student) {
      const chat = chats.find((chat) => chat.participants.includes(student.id));
      const resolvedChatId = chat ? chat.id : null;
      setChatIdState(resolvedChatId);
    } else {
      setChatIdState(null);
    }
  }, [student, chats]);

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
      // Ensure student and student.id are available before creating chat
      if (!student || !student.id) {
        throw new Error("Student details not available to create chat.");
      }
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

  const deleteStudent = async () => {
    try {
      // Ensure student and student.id are available before deleting
      if (!student || !student.id) {
        throw new Error("Student details not available to delete.");
      }
      const data = await handleDeleteStudent(student?.id, navigate);
      toast.success(data.message);
      onClose();
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleFetchClassEvents = async () => {
    setError(null); // Clear previous errors
    try {
      // Ensure student and student.id are available before fetching events
      if (!student || !student.id) {
        setPreviousClass(null);
        setNextClass(null);
        return; // Exit if no student or student id
      }
      const data = await fetchClassEventsForStudent(student.id, navigate);
      const now = new Date();

      const pastClasses = data.filter(
        (event) => new Date(event.start_time) < now
      );
      const futureClasses = data.filter(
        (event) => new Date(event.start_time) > now
      );

      // Sort past classes by start time descending to get the last one
      pastClasses.sort(
        (a, b) => new Date(b.start_time) - new Date(a.start_time)
      );
      // Sort future classes by start time ascending to get the next one
      futureClasses.sort(
        (a, b) => new Date(a.start_time) - new Date(b.start_time)
      );

      const lastClass = pastClasses.length > 0 ? pastClasses[0] : null; // Get the first after sorting descending
      const upcomingClass = futureClasses.length > 0 ? futureClasses[0] : null; // Get the first after sorting ascending

      // format the start_time into human readable format
      const formatTime = (time) => {
        if (!time) return "N/A";
        const date = new Date(time);
        const options = {
          weekday: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        };
        return date.toLocaleString(undefined, options);
      };

      setPreviousClass(
        lastClass
          ? { ...lastClass, start_time: formatTime(lastClass.start_time) }
          : null
      );
      setNextClass(
        upcomingClass
          ? {
              ...upcomingClass,
              start_time: formatTime(upcomingClass.start_time),
            }
          : null
      );
    } catch (error) {
      console.error("Error fetching class events:", error);
      setError("Failed to load class schedule.");
      setPreviousClass(null);
      setNextClass(null);
    }
  };

  useEffect(() => {
    if (student && student.id) {
      handleFetchClassEvents();
    } else {
      setPreviousClass(null);
      setNextClass(null);
      setError(null); // Clear error when no student is selected
    }
  }, [student, navigate]);

  // Format enrollment date
  const formatEnrollmentDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const options = { year: "numeric", month: "long", day: "numeric" };
      return date.toLocaleDateString(undefined, options);
    } catch (e) {
      console.error("Invalid date format:", dateString);
      return dateString; // Return original if formatting fails
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ backdropFilter: "blur(2px)" }}
    >
      <Box
        sx={{
          width: 500,
          p: 3,
          height: "100%",
          backgroundColor: "#252525",
          color: "white",
        }}
      >
        {student ? (
          <>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "100%",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center", // Changed to center for vertical alignment
                  justifyContent: "space-between",
                  mb: 3, // Added margin bottom
                }}
              >
                <Avatar
                  alt={student.first_name}
                  src={student.profile_picture}
                  sx={{ width: 64, height: 64, mr: 2 }} // Increased avatar size slightly
                >
                  {student.first_name ? student.first_name[0] : null}
                </Avatar>
                <Typography
                  variant="h5" // Increased font size
                  sx={{ color: "white", fontWeight: "bold" }} // Added bold font weight
                >
                  {student.first_name} {student.last_name}
                </Typography>
              </Box>

              {/* General Information Section */}
              <Box sx={{ mb: 3 }}>
                <Divider sx={{ bgcolor: "#444", my: 2 }} />{" "}
                <Typography variant="h6" sx={{ color: "#fff", mb: 1 }}>
                  General Information
                </Typography>
                <Box sx={{ ml: 2 }}>
                  {" "}
                  {/* Indent details */}
                  <Typography variant="body1" sx={{ color: "#ccc", mb: 0.5 }}>
                    <strong>Enrollment Date:</strong>{" "}
                    {formatEnrollmentDate(student.enrollment_date)}
                  </Typography>
                  {/* Add other general details here as needed */}
                  {/*
                  <Typography variant="body1" sx={{ color: "#ccc", mb: 0.5 }}>
                      <strong>Student ID:</strong> {student.id}
                  </Typography>
                  */}
                </Box>
              </Box>

              {/* Class Schedule Section */}
              <Box sx={{ mb: 3 }}>
                <Divider sx={{ bgcolor: "#444", my: 2 }} />
                <Typography variant="h6" sx={{ color: "#fff", mb: 1 }}>
                  Class Schedule
                </Typography>
                <Box sx={{ ml: 2 }}>
                  {error && <Typography color="error">{error}</Typography>}
                  {!error && (
                    <>
                      {previousClass ? (
                        <Box
                          sx={{
                            mb: 1,
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            p: 1,
                            backgroundColor: "#333",
                            borderRadius: 5,
                            alignItems: "center",
                          }}
                        >
                          <Box
                            sx={{ display: "flex", flexDirection: "column" }}
                          >
                            <Typography
                              variant="h6"
                              sx={{ color: "#ccc", mb: 0.5 }}
                            >
                              Previous Class
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: "#bbb", mb: 0.5, ml: 2 }}
                            >
                              {previousClass.subject.name}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: "#bbb", mb: 0.5, ml: 2 }}
                            >
                              {previousClass.start_time}
                            </Typography>
                          </Box>
                          <SecondaryButton
                            size="small" // Made button smaller
                            onClick={() =>
                              handleNavigateToClass(previousClass.id)
                            }
                            sx={{ mt: 0.5, maxHeight: 48 }} // Added some margin top
                          >
                            View Class
                          </SecondaryButton>
                        </Box>
                      ) : (
                        <Typography
                          variant="body1"
                          sx={{ color: "#ccc", mb: 1 }}
                        >
                          No Previous Class Found.
                        </Typography>
                      )}
                      {nextClass ? (
                        <Box
                          sx={{
                            mb: 1,
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            p: 1,
                            backgroundColor: "#333",
                            borderRadius: 5,
                            alignItems: "center",
                          }}
                        >
                          <Box
                            sx={{ display: "flex", flexDirection: "column" }}
                          >
                            <Typography
                              variant="h6"
                              sx={{ color: "#ccc", mb: 0.5 }}
                            >
                              Next Class
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: "#bbb", mb: 0.5, ml: 1 }}
                            >
                              {nextClass.subject.name}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: "#bbb", mb: 0.5, ml: 1 }}
                            >
                              {nextClass.start_time}
                            </Typography>
                          </Box>
                          <SecondaryButton
                            size="small"
                            onClick={() => handleNavigateToClass(nextClass.id)}
                            sx={{ mt: 0.5 }}
                          >
                            View Class
                          </SecondaryButton>
                        </Box>
                      ) : (
                        <Typography
                          variant="body1"
                          sx={{ color: "#ccc", mb: 1 }}
                        >
                          No Upcoming Class Found.
                        </Typography>
                      )}
                    </>
                  )}
                </Box>
              </Box>
              <Box>
                <Divider sx={{ bgcolor: "#444", my: 2 }} />
                <Typography variant="h6" sx={{ color: "#fff", mb: 1 }}>
                  Class Groups
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    mb: 2,
                  }}
                >
                  {student.class_groups.map((group) => {
                    return <ClassGroupChip key={group.id} classGroup={group} />; // <-- Added 'return'
                  })}
                </Box>
              </Box>
              <Box>
                <Divider sx={{ bgcolor: "#444", my: 2 }} />
                {/* Actions Section */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-around",
                    mt: 3,
                  }}
                >
                  {" "}
                  {/* Adjusted spacing and margin top */}
                  <PrimaryButton
                    variant="contained" // Use contained variant for primary action
                    onClick={
                      chatId ? () => handleSelectChat(chatId) : handleCreateChat
                    }
                  >
                    {chatId ? "Open Chat" : "Create Chat"}
                  </PrimaryButton>
                  <WarningButton
                    variant="contained" // Use contained variant for warning action
                    onClick={deleteStudent}
                  >
                    Delete Student
                  </WarningButton>
                </Box>
              </Box>
            </Box>
          </>
        ) : (
          <Typography sx={{ color: "white", textAlign: "center", mt: 4 }}>
            No Student selected.
          </Typography>
        )}
      </Box>
    </Drawer>
  );
}
