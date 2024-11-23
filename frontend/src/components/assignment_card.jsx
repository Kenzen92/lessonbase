import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  AvatarGroup,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { toast } from "react-toastify";

const TabPanel = ({ children, value, index }) => (
  <Box hidden={value !== index} sx={{ p: 2 }}>
    {value === index && children}
  </Box>
);

const AssignmentCard = ({ assignment, handleReloadData }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editedAssignment, setEditedAssignment] = useState({
    title: assignment.title,
    description: assignment.description,
    max_score: assignment.max_score,
    due_date: assignment.due_date,
  });
  const inputStyle = {
    "& .MuiOutlinedInput-root": {
      color: "#fff", // Text color
      "& fieldset": {
        borderColor: "#fff", // Border color
      },
      "&:hover fieldset": {
        borderColor: "#fff", // Hover border color
      },
    },
    "& .MuiInputLabel-root": {
      color: "#fff", // Label color
    },
    "& .MuiSvgIcon-root": {
      color: "#fff", // Icon color
    },
  };

  const handleTabChange = (event, newIndex) => setTabIndex(newIndex);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedAssignment((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditAssignment = async () => {
    try {
      const auth = window.sessionStorage.getItem("token");
      const response = await fetch(`/assignment/${assignment.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${auth}`,
        },
        body: JSON.stringify(editedAssignment),
      });

      if (response.ok) {
        toast.success("Assignment updated successfully!");
        handleReloadData();
      } else {
        throw new Error("Failed to update assignment");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

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

  return (
    <Box
      sx={{
        boxShadow: 2,
        p: 1,
        borderColor: "#fff",
        borderRadius: "10px",
        borderStyle: "solid",
        backgroundColor: "#292929",
      }}
    >
      <Typography variant="h6" gutterBottom>
        {assignment.title}
      </Typography>

      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        aria-label="assignment tabs"
      >
        <Tab label="Details" sx={{ width: "50%", color: "#fff" }} />
        <Tab label="Edit" sx={{ width: "50%", color: "#fff" }} />
      </Tabs>

      <TabPanel value={tabIndex} index={0}>
        <Typography variant="body1" gutterBottom>
          {assignment.description}
        </Typography>
        <Typography variant="body2" gutterBottom>
          Max Score: {assignment.max_score}
        </Typography>
        <Typography variant="body2" gutterBottom>
          Due Date: {new Date(assignment.due_date).toLocaleDateString()}
        </Typography>
        <AvatarGroup max={4}>
          {assignment.students.map((student, index) => (
            <Avatar
              key={index}
              alt={student.username}
              src={student.profile_picture}
            >
              {student.username ? student.username : null}
            </Avatar>
          ))}
        </AvatarGroup>
      </TabPanel>

      <TabPanel value={tabIndex} index={1}>
        <TextField
          fullWidth
          label="Title"
          name="title"
          value={editedAssignment.title}
          onChange={handleInputChange}
          sx={{
            mb: 2,
            ...inputStyle,
          }}
        />
        <TextField
          fullWidth
          label="Description"
          name="description"
          value={editedAssignment.description}
          onChange={handleInputChange}
          multiline
          sx={{ mb: 2, ...inputStyle }}
        />
        <TextField
          fullWidth
          label="Max Score"
          name="max_score"
          value={editedAssignment.max_score}
          onChange={handleInputChange}
          type="number"
          sx={{ mb: 2, ...inputStyle }}
        />
        <TextField
          fullWidth
          label="Due Date"
          name="due_date"
          value={editedAssignment.due_date}
          onChange={handleInputChange}
          type="date"
          sx={{ mb: 2, ...inputStyle }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleEditAssignment}
        >
          Save Changes
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={() => setDeleteConfirmOpen(true)}
          sx={{ mt: 2 }}
        >
          Delete Assignment
        </Button>
      </TabPanel>

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
    </Box>
  );
};

export default AssignmentCard;
