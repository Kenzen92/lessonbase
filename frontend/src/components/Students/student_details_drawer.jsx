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
  Grid,
  Card,
  CardContent,
  LinearProgress,
  IconButton,
  Tooltip,
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
import {
  FaEnvelope,
  FaCalendarAlt,
  FaBook,
  FaClock,
  FaChartLine,
  FaUserGraduate,
  FaTimes,
} from "react-icons/fa";

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
  const [classStats, setClassStats] = useState({
    totalClasses: 0,
    completedClasses: 0,
    upcomingClasses: 0,
  });
  // Added error state for potential API call issues
  const [error, setError] = useState(null);

  console.log(student);

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

      // Calculate stats
      setClassStats({
        totalClasses: data.length,
        completedClasses: pastClasses.length,
        upcomingClasses: futureClasses.length,
      });

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
      sx={{
        backdropFilter: "blur(4px)",
        "& .MuiDrawer-paper": {
          background: "linear-gradient(135deg, #10101dff 0%, #0a132bff 100%)",
        },
      }}
    >
      <Box
        sx={{
          width: 520,
          height: "100%",
          backgroundColor: "transparent",
          color: "white",
          overflowY: "auto",
        }}
      >
        {student ? (
          <>
            {/* Header Section with Close Button */}
            <Box
              sx={{
                position: "sticky",
                top: 0,
                // background:
                //   "linear-gradient(135deg, #08203cff 0%, #101628ff 100%)",
                zIndex: 10,
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                p: 3,
                pb: 2,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
                <IconButton
                  onClick={onClose}
                  sx={{
                    color: "rgba(255, 255, 255, 0.7)",
                    "&:hover": {
                      color: "white",
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                  }}
                >
                  <FaTimes />
                </IconButton>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Avatar
                  alt={student.first_name}
                  src={student.profile_picture}
                  sx={{
                    width: 80,
                    height: 80,
                    border: "3px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  <FaUserGraduate size={40} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      color: "white",
                      fontWeight: "bold",
                      mb: 0.5,
                    }}
                  >
                    {student.first_name} {student.last_name}
                  </Typography>
                  {student.email && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <FaEnvelope size={14} color="rgba(255, 255, 255, 0.6)" />
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                      >
                        {student.email}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>

            <Box sx={{ p: 3 }}>
              {/* Quick Stats Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={4}>
                  <Card
                    sx={{
                      backgroundColor: "rgba(33, 150, 243, 0.1)",
                      border: "1px solid rgba(33, 150, 243, 0.3)",
                      textAlign: "center",
                    }}
                  >
                    <CardContent sx={{ py: 2, px: 1 }}>
                      <FaBook size={24} color="#2196F3" />
                      <Typography
                        variant="h4"
                        sx={{ color: "#2196F3", fontWeight: "bold", my: 1 }}
                      >
                        {classStats.totalClasses}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                      >
                        Total Classes
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={4}>
                  <Card
                    sx={{
                      backgroundColor: "rgba(76, 175, 80, 0.1)",
                      border: "1px solid rgba(76, 175, 80, 0.3)",
                      textAlign: "center",
                    }}
                  >
                    <CardContent sx={{ py: 2, px: 1 }}>
                      <FaChartLine size={24} color="#4CAF50" />
                      <Typography
                        variant="h4"
                        sx={{ color: "#4CAF50", fontWeight: "bold", my: 1 }}
                      >
                        {classStats.completedClasses}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                      >
                        Completed
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={4}>
                  <Card
                    sx={{
                      backgroundColor: "rgba(255, 152, 0, 0.1)",
                      border: "1px solid rgba(255, 152, 0, 0.3)",
                      textAlign: "center",
                    }}
                  >
                    <CardContent sx={{ py: 2, px: 1 }}>
                      <FaClock size={24} color="#FF9800" />
                      <Typography
                        variant="h4"
                        sx={{ color: "#FF9800", fontWeight: "bold", my: 1 }}
                      >
                        {classStats.upcomingClasses}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                      >
                        Upcoming
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Progress Overview */}
              {classStats.totalClasses > 0 && (
                <Card
                  sx={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    mb: 3,
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      sx={{ color: "#fff", mb: 1, fontWeight: 600 }}
                    >
                      Class Progress
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={
                            (classStats.completedClasses /
                              classStats.totalClasses) *
                            100
                          }
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            "& .MuiLinearProgress-bar": {
                              backgroundColor: "#4CAF50",
                              borderRadius: 4,
                            },
                          }}
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{ color: "#4CAF50", fontWeight: "bold" }}
                      >
                        {Math.round(
                          (classStats.completedClasses /
                            classStats.totalClasses) *
                            100
                        )}
                        %
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* General Information Section */}
              <Card
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  mb: 3,
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{
                      color: "#fff",
                      mb: 2,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <FaUserGraduate color="#2196F3" />
                    General Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "rgba(255, 255, 255, 0.6)",
                          display: "block",
                        }}
                      >
                        Student ID
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ color: "#fff", fontWeight: 500 }}
                      >
                        #{student.id}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "rgba(255, 255, 255, 0.6)",
                          display: "block",
                        }}
                      >
                        Enrollment Date
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ color: "#fff", fontWeight: 500 }}
                      >
                        {formatEnrollmentDate(student.enrollment_date)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "rgba(255, 255, 255, 0.6)",
                          display: "block",
                          mb: 0.5,
                        }}
                      >
                        Account Status
                      </Typography>
                      <Chip
                        label={
                          student.is_confirmed
                            ? "Confirmed"
                            : "Pending Confirmation"
                        }
                        size="small"
                        sx={{
                          backgroundColor: student.is_confirmed
                            ? "rgba(76, 175, 80, 0.2)"
                            : "rgba(255, 152, 0, 0.2)",
                          color: student.is_confirmed ? "#4CAF50" : "#FF9800",
                          border: `1px solid ${
                            student.is_confirmed ? "#4CAF50" : "#FF9800"
                          }`,
                          fontWeight: 500,
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Class Schedule Section */}
              <Card
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  mb: 3,
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{
                      color: "#fff",
                      mb: 2,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <FaCalendarAlt color="#2196F3" />
                    Class Schedule
                  </Typography>

                  {error && (
                    <Typography color="error" sx={{ mb: 2 }}>
                      {error}
                    </Typography>
                  )}

                  {!error && (
                    <Box>
                      {/* Previous Class */}
                      {previousClass ? (
                        <Card
                          sx={{
                            mb: 2,
                            backgroundColor: "rgba(255, 255, 255, 0.03)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              backgroundColor: "rgba(255, 255, 255, 0.06)",
                              borderColor: "rgba(255, 255, 255, 0.15)",
                            },
                          }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                              }}
                            >
                              <Box sx={{ flex: 1 }}>
                                <Typography
                                  variant="caption"
                                  sx={{ color: "rgba(255, 255, 255, 0.5)" }}
                                >
                                  Previous Class
                                </Typography>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    color: "#fff",
                                    fontWeight: 600,
                                    mb: 0.5,
                                  }}
                                >
                                  {previousClass.subject.name}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "rgba(255, 255, 255, 0.7)",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  {previousClass.start_time}
                                </Typography>
                              </Box>
                              <SecondaryButton
                                size="small"
                                onClick={() =>
                                  handleNavigateToClass(previousClass.id)
                                }
                                sx={{ mt: 1, minWidth: 90 }}
                              >
                                View Class
                              </SecondaryButton>
                            </Box>
                          </CardContent>
                        </Card>
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            color: "rgba(255, 255, 255, 0.5)",
                            mb: 2,
                            fontStyle: "italic",
                          }}
                        >
                          No previous class found
                        </Typography>
                      )}

                      {/* Next Class */}
                      {nextClass ? (
                        <Card
                          sx={{
                            backgroundColor: "rgba(33, 150, 243, 0.1)",
                            border: "1px solid rgba(33, 150, 243, 0.3)",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              backgroundColor: "rgba(33, 150, 243, 0.15)",
                              borderColor: "rgba(33, 150, 243, 0.5)",
                            },
                          }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                              }}
                            >
                              <Box sx={{ flex: 1 }}>
                                <Typography
                                  variant="caption"
                                  sx={{ color: "#2196F3" }}
                                >
                                  Next Class
                                </Typography>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    color: "#fff",
                                    fontWeight: 600,
                                    mb: 0.5,
                                  }}
                                >
                                  {nextClass.subject.name}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "rgba(255, 255, 255, 0.8)",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  {nextClass.start_time}
                                </Typography>
                              </Box>
                              <SecondaryButton
                                size="small"
                                onClick={() =>
                                  handleNavigateToClass(nextClass.id)
                                }
                                sx={{ mt: 1, minWidth: 90 }}
                              >
                                View Class
                              </SecondaryButton>
                            </Box>
                          </CardContent>
                        </Card>
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            color: "rgba(255, 255, 255, 0.5)",
                            fontStyle: "italic",
                          }}
                        >
                          No upcoming class scheduled
                        </Typography>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Class Groups Section */}
              <Card
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  mb: 3,
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{
                      color: "#fff",
                      mb: 2,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <FaBook color="#2196F3" />
                    Class Groups
                  </Typography>
                  {student.class_groups && student.class_groups.length > 0 ? (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 1,
                      }}
                    >
                      {student.class_groups.map((group) => (
                        <ClassGroupChip key={group.id} classGroup={group} />
                      ))}
                    </Box>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255, 255, 255, 0.5)",
                        fontStyle: "italic",
                      }}
                    >
                      Not enrolled in any class groups
                    </Typography>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
                <PrimaryButton
                  fullWidth
                  onClick={
                    chatId ? () => handleSelectChat(chatId) : handleCreateChat
                  }
                  sx={{ flex: 1 }}
                >
                  {chatId ? "Open Chat" : "Create Chat"}
                </PrimaryButton>
                <WarningButton
                  fullWidth
                  onClick={deleteStudent}
                  sx={{ flex: 1 }}
                >
                  Delete Student
                </WarningButton>
              </Box>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Typography
              sx={{ color: "rgba(255, 255, 255, 0.5)", textAlign: "center" }}
            >
              No student selected
            </Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
