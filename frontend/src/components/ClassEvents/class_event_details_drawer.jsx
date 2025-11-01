import React, { useState, useEffect } from "react";
import {
  Box,
  List,
  Typography,
  Drawer,
  Chip,
  Card,
  CardContent,
  Grid,
  IconButton,
  Divider,
} from "@mui/material";
import StudentListCard from "../Students/student_list_card";
import ClassResources from "../Resources/class_resources";
import { getSubjectIcon } from "../../utils/icons";
import { PrimaryButton, WarningButton } from "../../styles/buttons";
import { useAuth } from "../../contexts/auth_context";
import {
  FaTimes,
  FaCalendarAlt,
  FaClock,
  FaUsers,
  FaBook,
} from "react-icons/fa";

export default function ClassEventDetailsDrawer({
  open,
  handleClose,
  currentClassEvent,
  onClose,
  handleReloadData,
  handleOpenStudentSearch,
  handleCancelClassEvent,
}) {
  const { auth } = useAuth();
  const eventDate = new Date(currentClassEvent?.start_time);
  const formattedDate = eventDate.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = eventDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  // Ensure assignmentDetails is available before trying to get the icon
  const IconComponent =
    currentClassEvent?.subject?.name &&
    getSubjectIcon(currentClassEvent.subject.name);

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
        {currentClassEvent && (
          <>
            {/* Header Section with Close Button */}
            <Box
              sx={{
                position: "sticky",
                top: 0,
                background: "linear-gradient(135deg, #0f3460 0%, #16213e 100%)",
                zIndex: 10,
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                p: 3,
                pb: 2,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
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

              <Box sx={{ mb: 2 }}>
                <Chip
                  icon={
                    IconComponent && <IconComponent color="#fff" size={20} />
                  }
                  label={currentClassEvent.subject.name}
                  sx={{
                    color: "#fff",
                    fontSize: "1rem",
                    height: "2.5rem",
                    minWidth: "12rem",
                    backgroundColor: currentClassEvent.subject.color,
                    fontWeight: 600,
                    mb: 2,
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                  }}
                />
                <Typography
                  variant="h4"
                  sx={{
                    color: "white",
                    fontWeight: "bold",
                    mb: 1,
                  }}
                >
                  {currentClassEvent.name}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  <FaCalendarAlt size={14} color="rgba(255, 255, 255, 0.6)" />
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255, 255, 255, 0.8)" }}
                  >
                    {formattedDate}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FaClock size={14} color="rgba(255, 255, 255, 0.6)" />
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255, 255, 255, 0.8)" }}
                  >
                    {formattedTime}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ p: 3 }}>
              {/* Quick Stats */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <Card
                    sx={{
                      backgroundColor: "rgba(33, 150, 243, 0.1)",
                      border: "1px solid rgba(33, 150, 243, 0.3)",
                      textAlign: "center",
                    }}
                  >
                    <CardContent sx={{ py: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 2,
                        }}
                      >
                        <FaUsers size={24} color="#2196F3" />
                        <Box>
                          <Typography
                            variant="h4"
                            sx={{ color: "#2196F3", fontWeight: "bold" }}
                          >
                            {currentClassEvent.students?.length || 0}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                          >
                            Students Enrolled
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Students Section */}
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
                    <FaUsers color="#2196F3" />
                    Students
                  </Typography>
                  {currentClassEvent.students &&
                  currentClassEvent.students.length > 0 ? (
                    <List sx={{ p: 0 }}>
                      {currentClassEvent.students.map((student, index) => (
                        <Box
                          key={student.id}
                          sx={{
                            mb:
                              index < currentClassEvent.students.length - 1
                                ? 1
                                : 0,
                          }}
                        >
                          <StudentListCard
                            student={student}
                            action={"navigate"}
                          />
                        </Box>
                      ))}
                    </List>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255, 255, 255, 0.5)",
                        fontStyle: "italic",
                      }}
                    >
                      No students enrolled
                    </Typography>
                  )}
                </CardContent>
              </Card>

              {/* Class Resources Section */}
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
                    Class Resources
                  </Typography>
                  <ClassResources
                    classId={currentClassEvent?.id}
                    existing_resources={currentClassEvent?.resources}
                    handleReloadData={handleReloadData}
                  />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              {auth.userType == "teacher" && (
                <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
                  <PrimaryButton
                    fullWidth
                    onClick={handleOpenStudentSearch}
                    sx={{ flex: 1 }}
                  >
                    Edit Event
                  </PrimaryButton>
                  <WarningButton
                    fullWidth
                    onClick={handleCancelClassEvent}
                    sx={{ flex: 1 }}
                  >
                    Cancel Class
                  </WarningButton>
                </Box>
              )}
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
}
