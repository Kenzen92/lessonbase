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
} from "@mui/material";
import StudentListCard from "../Students/student_list_card";
import StudentAssignmentAttemptCard from "./student_assignment_attempt_card";
import { fetchAssignment } from "../../utils/agent";
import { getSubjectIcon } from "../../utils/icons";
import { useAuth } from "../../contexts/auth_context";
import StudentAssignmentAttemptForm from "./student_assignment_attempt_form";

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
  const { auth } = useAuth();
  const is_teacher = auth.userType === "Teacher ";
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
  }, [assignment]); // Re-run when assignment changes

  // Ensure assignmentDetails is available before trying to get the icon
  const IconComponent =
    assignmentDetails?.subject?.name &&
    getSubjectIcon(assignmentDetails.subject.name);

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{ backdropFilter: "blur(2px)" }}
      >
        <Box
          sx={{ width: 500, p: 3, height: "100%", backgroundColor: "#252525" }}
        >
          {assignmentDetails ? (
            <>
              <Typography
                variant="h6"
                sx={{ color: "white", mb: 2, textAlign: "center" }}
              >
                {assignmentDetails.title}
              </Typography>
              <Chip
                icon={<IconComponent color="#fff" size={20} />}
                label={assignmentDetails.subject.name}
                size={"medium"}
                sx={{
                  color: "#fff",
                  fontSize: 20,
                  mt: 2,
                  mb: 2,
                  height: "2.2rem",
                  minWidth: "10rem",
                  backgroundColor: assignmentDetails.subject.color,
                }}
              />
              <Typography sx={{ color: "white", mb: 2 }}>
                {assignmentDetails.description}
              </Typography>
              {is_teacher && (
                <List>
                  {assignmentDetails.students.map((student) => (
                    <Box
                      sx={{
                        backgroundColor: "#333",
                        transition: "background-color 0.3s ease",
                        "&:hover": {
                          backgroundColor: "#444", // slightly lighter
                        },
                        padding: 1,
                        margin: 1,
                        borderRadius: 3,
                      }}
                    >
                      <StudentListCard
                        key={student.id}
                        student={student}
                        action={"navigate"}
                      />
                      <StudentAssignmentAttemptCard
                        assignment={assignment}
                        student={student}
                        setCurrentAssignmentAttempt={
                          setCurrentAssignmentAttempt
                        }
                        setFeedbackModalOpen={setFeedbackModalOpen}
                      />
                    </Box>
                  ))}
                </List>
              )}

              {!is_teacher && (
                <StudentAssignmentAttemptForm assignment={assignment} />
              )}

              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 2, width: "100%" }}
                onClick={onEdit}
              >
                Edit Assignment
              </Button>
            </>
          ) : (
            <Typography sx={{ color: "white" }}>
              No Assignment selected.
            </Typography>
          )}
        </Box>
      </Drawer>
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
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
