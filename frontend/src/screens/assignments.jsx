import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Navigation from "../components/main_navigation";
import { Grid, Box, Typography, Container, Tooltip } from "@mui/material";
import AssignmentCard from "../components/Assignments/assignment_card.jsx";
import AddAssignmentModal from "../components/Assignments/add_assignment_modal.jsx";
import {
  fetchAllAssignments,
  fetchClassGroups,
  fetchStudents,
  fetchSubjects,
} from "../utils/agent.js";
import ActionStatisticsBar from "../components/Dashboard/action_statistics_bar.jsx";
import AssignmentDetailsDrawer from "../components/Assignments/assignment_details_drawer.jsx";
import { PrimaryButton } from "../styles/buttons.jsx";
import AssignmentFeedbackModal from "../components/Assignments/assignment_feedback_modal.jsx";
import { useAuth } from "../contexts/auth_context.jsx";

function Assignments() {
  const { auth } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(false);
  const [currentAssignmentAttempt, setCurrentAssignmentAttempt] =
    useState(null);
  const [classGroups, setClassGroups] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);

  const [feedbackModelOpen, setFeedbackModalOpen] = useState(false);

  const is_teacher = auth.userType == "teacher";
  const navigate = useNavigate();
  const columns = [
    {
      label: is_teacher ? "Overdue" : "Late", // Set label to the original name
      name: "Overdue", // Set name to the teacher's default
      color: "#400702",
      description: "Assignments that were due but not submitted in time.",
    },
    {
      label: is_teacher ? "To Mark" : "Submitted", // Set label to the original name
      name: "To Mark", // Set name to the teacher's default
      color: "#FF8C00",
      description: "Assignments awaiting grading or feedback.",
    },
    {
      label: is_teacher ? "Set" : "To Do", // Set label to the original name
      name: "Set", // Set name to the teacher's default
      color: "#2F4F4F",
      description: "Newly set assignments that need to be reviewed.",
    },
    {
      label: "Upcoming", // Set label to the original name
      name: "Upcoming", // Set name to the teacher's default
      color: "#4682B4",
      description: "Assignments scheduled for the near future.",
    },
    {
      label: "Marked", // Set label to the original name
      name: "Marked", // Set name to the teacher's default
      color: "#006400",
      description: "Assignments that have been reviewed and marked.",
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      const assignments = await fetchAllAssignments(navigate);
      if (assignments) setAssignments(assignments);
      const classGroups = await fetchClassGroups();
      if (classGroups) setClassGroups(classGroups);
      const subjects = await fetchSubjects();
      if (subjects) setAllSubjects(subjects);
      const students = await fetchStudents();
      if (students) setAllStudents(students);
    };
    fetchData();
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <Navigation />
      <Container>
        <ActionStatisticsBar
          page="assignments"
          actionFunction={setIsOpen}
          actionText="Create Assignment"
        />

        <AddAssignmentModal
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          students={allStudents}
          subjects={allSubjects}
          classGroups={classGroups}
        />
        <AssignmentFeedbackModal
          feedbackModelOpen={feedbackModelOpen}
          setFeedbackModalOpen={setFeedbackModalOpen}
          currentAssignmentAttempt={currentAssignmentAttempt}
        />

        <AssignmentDetailsDrawer
          open={drawerOpen}
          setOpen={setDrawerOpen}
          onClose={() => setDrawerOpen(false)}
          assignment={currentAssignment}
          setCurrentAssignmentAttempt={setCurrentAssignmentAttempt}
          setFeedbackModalOpen={setFeedbackModalOpen}
        />

        <Box
          className="assignment-dashboard"
          sx={{
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            marginTop: "1vh",
            p: 1,
          }}
        >
          <Grid container spacing={1} sx={{ height: "100%" }}>
            {columns.map((column, index) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                lg={3}
                xl={2.4}
                key={index}
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  textAlign: "center",
                  marginTop: "1em",
                  minHeight: "15em",
                }}
              >
                <Tooltip title={column.description} arrow>
                  <Box
                    sx={{
                      backgroundColor: column.color,
                      color: "#fff",
                      borderRadius: "4px 4px 0 0",
                    }}
                  >
                    <Typography variant="h6">{column.name}</Typography>
                  </Box>
                </Tooltip>
                <Box
                  sx={{
                    flex: 1,
                    overflowY: "auto",
                    backgroundColor: "#292929",
                    borderRadius: "0 0 4px 4px",
                  }}
                >
                  {assignments && assignments[column.name] ? (
                    assignments[column.name].map((assignment, index) => (
                      <Box sx={{ m: 0.2 }} key={index}>
                        <AssignmentCard
                          assignment={assignment}
                          setDrawerOpen={setDrawerOpen}
                          setCurrentAssignment={setCurrentAssignment}
                        />
                      </Box>
                    ))
                  ) : (
                    <Typography>No homeworks available</Typography>
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </>
  );
}

export default Assignments;
