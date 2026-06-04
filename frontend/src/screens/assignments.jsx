import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navigation from "../components/main_navigation";
import { Grid, Box, Typography, Container, Tooltip, Chip } from "@mui/material";
import AssignmentCard from "../components/Assignments/assignment_card.jsx";
import AddAssignmentWizard from "../components/Assignments/add_assignment_wizard.jsx";
import ActionStatisticsBar from "../components/Dashboard/action_statistics_bar.jsx";
import AssignmentDetailsDrawer from "../components/Assignments/assignment_details_drawer.jsx";
import AssignmentFeedbackModal from "../components/Assignments/assignment_feedback_modal.jsx";
import { useAuth } from "../contexts/auth_context.jsx";
import { useAssignments } from "../contexts/assignments_context.jsx";
import { useClassGroups } from "../contexts/class_groups_context.jsx";
import { useStudents } from "../contexts/students_context.jsx";

function Assignments() {
  const { auth } = useAuth();
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(false);
  const [currentAssignmentAttempt, setCurrentAssignmentAttempt] =
    useState(null);
  const [feedbackModelOpen, setFeedbackModalOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const is_teacher = auth.userType == "teacher";

  // Use contexts instead of local state
  const { data: assignments, refetch: refetchAssignments } = useAssignments();

  // Unique tags across every column, powering the board's tag filter (AC-TAG4).
  const allTags = useMemo(() => {
    const byName = new Map();
    Object.values(assignments || {}).forEach((list) =>
      (list || []).forEach((a) =>
        (a.tags || []).forEach((t) => {
          if (!byName.has(t.name)) byName.set(t.name, t);
        })
      )
    );
    return [...byName.values()];
  }, [assignments]);

  const toggleTag = (name) =>
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );

  // Show an assignment if it carries any of the selected tags (OR).
  const filterByTags = (list) => {
    if (selectedTags.length === 0) return list || [];
    return (list || []).filter((a) =>
      (a.tags || []).some((t) => selectedTags.includes(t.name))
    );
  };
  const { data: classGroups } = useClassGroups();
  const { data: allStudents } = useStudents();

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

        <AddAssignmentWizard
          key={editingAssignment?.id ?? "new"}
          open={isOpen}
          onClose={() => {
            setIsOpen(false);
            setEditingAssignment(null);
          }}
          students={allStudents}
          classGroups={classGroups}
          assignment={editingAssignment}
          onCreated={refetchAssignments}
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
          onEdit={() => {
            setEditingAssignment(currentAssignment);
            setDrawerOpen(false);
            setIsOpen(true);
          }}
          onFeedbackSubmitted={() => {
            // Refresh assignment data when feedback is submitted
            if (currentAssignment) {
              setCurrentAssignment({ ...currentAssignment });
            }
          }}
        />

        {allTags.length > 0 && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              mt: 2,
              alignItems: "center",
            }}
          >
            <Typography variant="body2" sx={{ color: "text.secondary", mr: 1 }}>
              Filter by tag:
            </Typography>
            {allTags.map((tag) => {
              const active = selectedTags.includes(tag.name);
              return (
                <Chip
                  key={tag.name}
                  label={tag.name}
                  clickable
                  size="small"
                  onClick={() => toggleTag(tag.name)}
                  variant={active ? "filled" : "outlined"}
                  sx={
                    active && tag.color
                      ? { backgroundColor: tag.color, color: "#fff" }
                      : undefined
                  }
                />
              );
            })}
            {selectedTags.length > 0 && (
              <Chip
                label="Clear"
                size="small"
                variant="outlined"
                onClick={() => setSelectedTags([])}
              />
            )}
          </Box>
        )}

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
                size={{ xs: 12, sm: 6, lg: 3, xl: 2.4 }}
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
                    filterByTags(assignments[column.name]).map(
                      (assignment, index) => (
                        <Box sx={{ m: 0.2 }} key={index}>
                          <AssignmentCard
                            assignment={assignment}
                            setDrawerOpen={setDrawerOpen}
                            setCurrentAssignment={setCurrentAssignment}
                          />
                        </Box>
                      )
                    )
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
