import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Drawer,
  List,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
  Card,
  CardContent,
  Grid,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Badge,
} from "@mui/material";
import StudentListCard from "../Students/student_list_card";
import StudentAssignmentAttemptCard from "./student_assignment_attempt_card";
import { fetchAssignment } from "../../utils/agent";
import { getSubjectIcon } from "../../utils/icons";
import { useAuth } from "../../contexts/auth_context";
import StudentAssignmentAttemptForm from "./student_assignment_attempt_form";
import { PrimaryButton, WarningButton } from "../../styles/buttons";
import {
  FaTimes,
  FaCalendarAlt,
  FaClock,
  FaUsers,
  FaCheckCircle,
  FaExclamationCircle,
  FaTimesCircle,
  FaChevronDown,
  FaBook,
  FaClipboardCheck,
} from "react-icons/fa";

export default function AssignmentDetailsDrawer({
  assignment,
  setCurrentAssignmentAttempt,
  open,
  onClose,
  onEdit,
  setFeedbackModalOpen,
}) {
  const [assignmentDetails, setAssignmentDetails] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [studentAttempts, setStudentAttempts] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    needsGrading: true,
    graded: false,
    notSubmitted: false,
  });
  const { auth } = useAuth();

  const handleDeleteAssignment = async () => {
    try {
      const auth = window.sessionStorage.getItem("token");
      const response = await fetch(`/assignment/${assignment.id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Token ${auth}`,
        },
      });

      if (response.ok) {
        toast.success("Assignment deleted successfully!");
        handleReloadData();
      } else {
        throw new Error("Failed to delete assignment");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleteConfirmOpen(false);
    }
  };

  useEffect(() => {
    if (assignment?.id) {
      const handleFetchAssignment = async () => {
        try {
          const assignmentDetails = await fetchAssignment(assignment.id);
          setAssignmentDetails(assignmentDetails);
        } catch (error) {
          console.error("Error fetching assignment details:", error);
        }
      };
      handleFetchAssignment();
    }
  }, [assignment]);

  // Ensure assignmentDetails is available before trying to get the icon
  const IconComponent =
    assignmentDetails?.subject?.name &&
    getSubjectIcon(assignmentDetails.subject.name);

  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleToggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <>
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
            width: 540,
            height: "100%",
            backgroundColor: "transparent",
            color: "white",
            overflowY: "auto",
          }}
        >
          {assignmentDetails ? (
            <>
              {/* Header Section with Close Button */}
              <Box
                sx={{
                  position: "sticky",
                  top: 0,
                  background:
                    "linear-gradient(135deg, #0f3460 0%, #16213e 100%)",
                  zIndex: 10,
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  p: 3,
                  pb: 2,
                }}
              >
                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}
                >
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
                    label={assignmentDetails.subject.name}
                    sx={{
                      color: "#fff",
                      fontSize: "1rem",
                      height: "2.5rem",
                      minWidth: "12rem",
                      backgroundColor: assignmentDetails.subject.color,
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
                      mb: 2,
                    }}
                  >
                    {assignmentDetails.title}
                  </Typography>

                  {/* Progress Bar */}
                  <Box sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                      >
                        Completion Progress
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "#4CAF50", fontWeight: "bold" }}
                      >
                        {Math.round(assignmentDetails?.progress || 0)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={assignmentDetails?.progress || 0}
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
                      Set: {formatDate(assignmentDetails.set_date)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <FaClock size={14} color="rgba(255, 255, 255, 0.6)" />
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255, 255, 255, 0.8)" }}
                    >
                      Due: {formatDate(assignmentDetails.due_date)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ p: 3 }}>
                {/* Assignment Description */}
                {assignmentDetails.description && (
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
                          mb: 1,
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <FaBook color="#2196F3" />
                        Description
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(255, 255, 255, 0.8)" }}
                      >
                        {assignmentDetails.description}
                      </Typography>
                    </CardContent>
                  </Card>
                )}

                {auth.userType === "teacher" && (
                  <TeacherStudentView
                    assignmentDetails={assignmentDetails}
                    assignment={assignment}
                    setCurrentAssignmentAttempt={setCurrentAssignmentAttempt}
                    setFeedbackModalOpen={setFeedbackModalOpen}
                    expandedSections={expandedSections}
                    handleToggleSection={handleToggleSection}
                  />
                )}

                {auth.userType === "student" && (
                  <StudentAssignmentAttemptForm assignment={assignment} />
                )}

                {/* Action Buttons */}
                {auth.userType === "teacher" && (
                  <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
                    <PrimaryButton fullWidth onClick={onEdit} sx={{ flex: 1 }}>
                      Edit Assignment
                    </PrimaryButton>
                    <WarningButton
                      fullWidth
                      onClick={() => setDeleteConfirmOpen(true)}
                      sx={{ flex: 1 }}
                    >
                      Delete
                    </WarningButton>
                  </Box>
                )}
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
                No assignment selected
              </Typography>
            </Box>
          )}
        </Box>
      </Drawer>
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: "#1e1e2e",
            color: "white",
          },
        }}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
            Are you sure you want to delete this assignment? This action cannot
            be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button color="error" onClick={handleDeleteAssignment}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// Separate component for teacher's student view with grouping
function TeacherStudentView({
  assignmentDetails,
  assignment,
  setCurrentAssignmentAttempt,
  setFeedbackModalOpen,
  expandedSections,
  handleToggleSection,
}) {
  const [studentAttempts, setStudentAttempts] = useState({});

  // Group students by their submission status
  const groupedStudents = React.useMemo(() => {
    if (!assignmentDetails?.students)
      return { needsGrading: [], graded: [], notSubmitted: [] };

    const groups = {
      needsGrading: [],
      graded: [],
      notSubmitted: [],
    };

    assignmentDetails.students.forEach((student) => {
      const attempt = studentAttempts[student.id];
      if (attempt) {
        if (attempt.graded) {
          groups.graded.push(student);
        } else {
          groups.needsGrading.push(student);
        }
      } else {
        groups.notSubmitted.push(student);
      }
    });

    return groups;
  }, [assignmentDetails?.students, studentAttempts]);

  return (
    <>
      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={4}>
          <Card
            sx={{
              backgroundColor: "rgba(255, 152, 0, 0.1)",
              border: "1px solid rgba(255, 152, 0, 0.3)",
              textAlign: "center",
            }}
          >
            <CardContent sx={{ py: 2, px: 1 }}>
              <FaExclamationCircle size={24} color="#FF9800" />
              <Typography
                variant="h4"
                sx={{ color: "#FF9800", fontWeight: "bold", my: 1 }}
              >
                {groupedStudents.needsGrading.length}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "rgba(255, 255, 255, 0.7)" }}
              >
                Needs Grading
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={4}>
          <Card
            sx={{
              backgroundColor: "rgba(76, 175, 80, 0.1)",
              border: "1px solid rgba(76, 175, 80, 0.3)",
              textAlign: "center",
            }}
          >
            <CardContent sx={{ py: 2, px: 1 }}>
              <FaCheckCircle size={24} color="#4CAF50" />
              <Typography
                variant="h4"
                sx={{ color: "#4CAF50", fontWeight: "bold", my: 1 }}
              >
                {groupedStudents.graded.length}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "rgba(255, 255, 255, 0.7)" }}
              >
                Graded
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={4}>
          <Card
            sx={{
              backgroundColor: "rgba(244, 67, 54, 0.1)",
              border: "1px solid rgba(244, 67, 54, 0.3)",
              textAlign: "center",
            }}
          >
            <CardContent sx={{ py: 2, px: 1 }}>
              <FaTimesCircle size={24} color="#F44336" />
              <Typography
                variant="h4"
                sx={{ color: "#F44336", fontWeight: "bold", my: 1 }}
              >
                {groupedStudents.notSubmitted.length}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "rgba(255, 255, 255, 0.7)" }}
              >
                Not Submitted
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Needs Grading Section */}
      <StudentGroupSection
        title="Needs Grading"
        students={groupedStudents.needsGrading}
        assignment={assignment}
        setCurrentAssignmentAttempt={setCurrentAssignmentAttempt}
        setFeedbackModalOpen={setFeedbackModalOpen}
        icon={<FaExclamationCircle color="#FF9800" />}
        color="#FF9800"
        expanded={expandedSections.needsGrading}
        onToggle={() => handleToggleSection("needsGrading")}
        studentAttempts={studentAttempts}
        setStudentAttempts={setStudentAttempts}
        showEmpty={groupedStudents.needsGrading.length === 0}
      />

      {/* Graded Section */}
      <StudentGroupSection
        title="Graded"
        students={groupedStudents.graded}
        assignment={assignment}
        setCurrentAssignmentAttempt={setCurrentAssignmentAttempt}
        setFeedbackModalOpen={setFeedbackModalOpen}
        icon={<FaCheckCircle color="#4CAF50" />}
        color="#4CAF50"
        expanded={expandedSections.graded}
        onToggle={() => handleToggleSection("graded")}
        studentAttempts={studentAttempts}
        setStudentAttempts={setStudentAttempts}
        showEmpty={groupedStudents.graded.length === 0}
      />

      {/* Not Submitted Section */}
      <StudentGroupSection
        title="Not Submitted"
        students={groupedStudents.notSubmitted}
        assignment={assignment}
        setCurrentAssignmentAttempt={setCurrentAssignmentAttempt}
        setFeedbackModalOpen={setFeedbackModalOpen}
        icon={<FaTimesCircle color="#F44336" />}
        color="#F44336"
        expanded={expandedSections.notSubmitted}
        onToggle={() => handleToggleSection("notSubmitted")}
        studentAttempts={studentAttempts}
        setStudentAttempts={setStudentAttempts}
        showEmpty={groupedStudents.notSubmitted.length === 0}
      />
    </>
  );
}

// Component for each grouped section
function StudentGroupSection({
  title,
  students,
  assignment,
  setCurrentAssignmentAttempt,
  setFeedbackModalOpen,
  icon,
  color,
  expanded,
  onToggle,
  studentAttempts,
  setStudentAttempts,
  showEmpty,
}) {
  return (
    <Card
      sx={{
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        mb: 2,
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Box
          onClick={onToggle}
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.03)",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {icon}
            <Typography
              variant="h6"
              sx={{ color: "#fff", fontWeight: 600, mr: 2 }}
            >
              {title}
            </Typography>
            <Badge
              badgeContent={students.length}
              sx={{
                "& .MuiBadge-badge": {
                  backgroundColor: color,
                  color: "white",
                  fontWeight: "bold",
                },
              }}
            />
          </Box>
          <FaChevronDown
            size={16}
            color="rgba(255, 255, 255, 0.7)"
            style={{
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s",
            }}
          />
        </Box>

        {expanded && (
          <Box sx={{ px: 2, pb: 2 }}>
            {students.length > 0 ? (
              students.map((student, index) => (
                <Box
                  key={student.id}
                  sx={{
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    borderRadius: 2,
                    p: 2,
                    mb: index < students.length - 1 ? 1.5 : 0,
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.06)",
                      borderColor: "rgba(255, 255, 255, 0.15)",
                    },
                  }}
                >
                  <StudentListCard student={student} action={"navigate"} />
                  <Box sx={{ mt: 1 }}>
                    <StudentAssignmentAttemptCard
                      assignment={assignment}
                      student={student}
                      setCurrentAssignmentAttempt={setCurrentAssignmentAttempt}
                      setFeedbackModalOpen={setFeedbackModalOpen}
                      onAttemptFetched={(attempt) => {
                        setStudentAttempts((prev) => ({
                          ...prev,
                          [student.id]: attempt,
                        }));
                      }}
                    />
                  </Box>
                </Box>
              ))
            ) : showEmpty ? (
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255, 255, 255, 0.5)",
                  fontStyle: "italic",
                  textAlign: "center",
                  py: 2,
                }}
              >
                No students in this category
              </Typography>
            ) : null}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
