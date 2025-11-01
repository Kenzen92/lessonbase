import React, { useState, useEffect } from "react";
import {
  Box,
  List,
  Divider,
  Typography,
  Button,
  Drawer,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
} from "@mui/material";
import StudentListCard from "../Students/student_list_card";
import { fetchClassGroup } from "../../utils/agent";
import { toast } from "react-toastify";
import { PrimaryButton } from "../../styles/buttons";
import {
  FaTimes,
  FaUsers,
  FaBook,
  FaInfoCircle,
  FaCode,
  FaGraduationCap,
} from "react-icons/fa";

export default function ClassDetailsDrawer({
  classGroupId,
  open,
  onClose,
  handleOpenStudentSearch,
}) {
  const [classGroup, setClassGroup] = useState(null);

  useEffect(() => {
    if (classGroupId) {
      fetchClassGroupData(classGroupId);
    } else {
      setClassGroup(null);
    }
  }, [classGroupId]);

  const fetchClassGroupData = async (id) => {
    const data = await fetchClassGroup(id);
    if (data) {
      setClassGroup(data);
    } else {
      toast.error("Failed to fetch class group data");
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
        {classGroup ? (
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

              <Box sx={{ mb: 1 }}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <FaGraduationCap size={28} color="#2196F3" />
                  <Typography
                    variant="h4"
                    sx={{
                      color: "white",
                      fontWeight: "bold",
                    }}
                  >
                    {classGroup.name}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FaCode size={14} color="rgba(255, 255, 255, 0.6)" />
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255, 255, 255, 0.8)" }}
                  >
                    Class Code: <strong>{classGroup.class_code}</strong>
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ p: 3 }}>
              {/* Quick Stats */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={6}>
                  <Card
                    sx={{
                      backgroundColor: "rgba(33, 150, 243, 0.1)",
                      border: "1px solid rgba(33, 150, 243, 0.3)",
                      textAlign: "center",
                    }}
                  >
                    <CardContent sx={{ py: 2, px: 1 }}>
                      <FaUsers size={24} color="#2196F3" />
                      <Typography
                        variant="h4"
                        sx={{ color: "#2196F3", fontWeight: "bold", my: 1 }}
                      >
                        {classGroup.students?.length || 0}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                      >
                        Students
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={6}>
                  <Card
                    sx={{
                      backgroundColor: "rgba(76, 175, 80, 0.1)",
                      border: "1px solid rgba(76, 175, 80, 0.3)",
                      textAlign: "center",
                    }}
                  >
                    <CardContent sx={{ py: 2, px: 1 }}>
                      <FaBook size={24} color="#4CAF50" />
                      <Typography
                        variant="h4"
                        sx={{ color: "#4CAF50", fontWeight: "bold", my: 1 }}
                      >
                        {classGroup.subjects?.length || 0}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                      >
                        Subjects
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Class Information */}
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
                    <FaInfoCircle color="#2196F3" />
                    Class Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "rgba(255, 255, 255, 0.6)",
                          display: "block",
                        }}
                      >
                        Description
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ color: "#fff", fontWeight: 500 }}
                      >
                        {classGroup.description || "No description provided"}
                      </Typography>
                    </Grid>
                    {classGroup.location && (
                      <Grid item xs={12}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "rgba(255, 255, 255, 0.6)",
                            display: "block",
                          }}
                        >
                          Location
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ color: "#fff", fontWeight: 500 }}
                        >
                          {classGroup.location}
                        </Typography>
                      </Grid>
                    )}
                    {(classGroup.year || classGroup.term) && (
                      <Grid item xs={12}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "rgba(255, 255, 255, 0.6)",
                            display: "block",
                            mb: 0.5,
                          }}
                        >
                          Academic Period
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ color: "#fff", fontWeight: 500 }}
                        >
                          {classGroup.year && `Year ${classGroup.year}`}
                          {classGroup.year && classGroup.term && " - "}
                          {classGroup.term && classGroup.term}
                        </Typography>
                      </Grid>
                    )}
                    {classGroup.status && (
                      <Grid item xs={12}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "rgba(255, 255, 255, 0.6)",
                            display: "block",
                            mb: 0.5,
                          }}
                        >
                          Status
                        </Typography>
                        <Chip
                          label={
                            classGroup.status.charAt(0).toUpperCase() +
                            classGroup.status.slice(1)
                          }
                          size="small"
                          sx={{
                            backgroundColor:
                              classGroup.status === "active"
                                ? "rgba(76, 175, 80, 0.2)"
                                : classGroup.status === "archived"
                                ? "rgba(158, 158, 158, 0.2)"
                                : "rgba(244, 67, 54, 0.2)",
                            color:
                              classGroup.status === "active"
                                ? "#4CAF50"
                                : classGroup.status === "archived"
                                ? "#9E9E9E"
                                : "#F44336",
                            border: `1px solid ${
                              classGroup.status === "active"
                                ? "#4CAF50"
                                : classGroup.status === "archived"
                                ? "#9E9E9E"
                                : "#F44336"
                            }`,
                            fontWeight: 500,
                          }}
                        />
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>

              {/* Subjects Section */}
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
                    Subjects
                  </Typography>
                  {classGroup.subjects && classGroup.subjects.length > 0 ? (
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1,
                      }}
                    >
                      {classGroup.subjects.map((subject) => (
                        <Chip
                          key={subject.id}
                          label={subject.name}
                          sx={{
                            backgroundColor:
                              subject.color || "rgba(33, 150, 243, 0.2)",
                            color: "#fff",
                            border: `1px solid ${subject.color || "#2196F3"}`,
                            fontWeight: 500,
                          }}
                        />
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
                      No subjects assigned
                    </Typography>
                  )}
                </CardContent>
              </Card>

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
                  {classGroup.students && classGroup.students.length > 0 ? (
                    <List sx={{ p: 0 }}>
                      {classGroup.students.map((student, index) => (
                        <Box
                          key={student.id}
                          sx={{
                            mb: index < classGroup.students.length - 1 ? 1 : 0,
                          }}
                        >
                          <StudentListCard student={student} action={"chat"} />
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

              {/* Action Button */}
              <PrimaryButton
                fullWidth
                onClick={handleOpenStudentSearch}
                sx={{ mt: 2 }}
              >
                Edit Class
              </PrimaryButton>
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
              No class group selected
            </Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
