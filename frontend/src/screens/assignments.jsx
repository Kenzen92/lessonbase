import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navigation from "../components/main_navigation";
import { Grid, Box, Typography, Container, Tooltip } from "@mui/material";
import AssignmentCard from "../components/Assignments/assignment_card.jsx";
import AddAssignmentModal from "../components/Assignments/add_assignment_modal.jsx";
import ActionStatisticsBar from "../components/Dashboard/action_statistics_bar.jsx";
import AssignmentDetailsDrawer from "../components/Assignments/assignment_details_drawer.jsx";
import AssignmentFeedbackModal from "../components/Assignments/assignment_feedback_modal.jsx";
import { useAuth } from "../contexts/auth_context.jsx";
import { useAssignments } from "../contexts/assignments_context.jsx";
import { useClassGroups } from "../contexts/class_groups_context.jsx";
import { useStudents } from "../contexts/students_context.jsx";
import { useSubjects } from "../contexts/subjects_context.jsx";

function Assignments() {
  const { auth } = useAuth();
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(false);
  const [currentAssignmentAttempt, setCurrentAssignmentAttempt] =
    useState(null);
  const [feedbackModelOpen, setFeedbackModalOpen] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const is_teacher = auth.userType == "teacher";

  // Use contexts instead of local state
  const { data: assignments } = useAssignments();
  const { data: classGroups } = useClassGroups();
  const { data: allStudents } = useStudents();
  const { data: allSubjects } = useSubjects();

  const columns = [
    {
      label: is_teacher ? "To Mark" : "Submitted", // Set label to the original name
      name: "To Mark", // Set name to the teacher's default
      color: "#FF8C00",
      description: "Assignments awaiting grading or feedback.",
    },
    {
      label: is_teacher ? "Ongoing" : "To Do", // Set label to the original name
      name: "Set", // Set name to the teacher's default
      color: "#2F4F4F",
      description: "Set assignments that need to be submitted.",
    },
    {
      label: "Upcoming", // Set label to the original name
      name: "Upcoming", // Set name to the teacher's default
      color: "#4682B4",
      description: "Assignments scheduled to be set in the future.",
    },
    {
      label: "Complete", // Set label to the original name
      name: "Complete", // Set name to the teacher's default
      color: "#006400",
      description:
        "Assignments that all students submitted and were reviewed and marked.",
    },
  ];

  useEffect(() => {
    // Handle the ID from params
    if (id !== undefined && assignments) {
      let currentAssignment = null;
      const intId = parseInt(id, 10);
      for (let key in assignments) {
        currentAssignment = assignments[key].find(
          (assignment) => assignment.id === intId
        );
        if (currentAssignment) {
          setCurrentAssignment(currentAssignment);
          setDrawerOpen(true);
          break;
        }
      }
    }
  }, [id, assignments]);

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
          handleReloadData={() => {
            // Trigger refresh by updating the assignment (this will cause the drawer to re-fetch)
            if (currentAssignment) {
              setCurrentAssignment({ ...currentAssignment });
            }
          }}
        />

        <AssignmentDetailsDrawer
          open={drawerOpen}
          setOpen={setDrawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            navigate("/assignments");
          }}
          assignment={currentAssignment}
          setCurrentAssignmentAttempt={setCurrentAssignmentAttempt}
          setFeedbackModalOpen={setFeedbackModalOpen}
          onFeedbackSubmitted={() => {
            // Refresh assignment data when feedback is submitted
            if (currentAssignment) {
              setCurrentAssignment({ ...currentAssignment });
            }
          }}
        />

        <Box
          className="assignment-dashboard"
          sx={{
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            marginTop: 2,
          }}
        >
          <Grid container spacing={2} sx={{ height: "100%" }}>
            {columns.map((column, index) => (
              <Grid
                item
                xs={12}
                sm={6}
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
