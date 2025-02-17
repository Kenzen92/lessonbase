import React, { useState } from "react";
import {
  Box,
  List,
  Divider,
  TextField,
  Button,
  Typography,
  Drawer,
} from "@mui/material";
import StudentListCard from "./student_list_card";
import { editClassGroup } from "../utils/agent";
import { toast } from "react-toastify";

const removeStudent = (studentId) => {
  console.log("Removing student with id: ", studentId);
};

const handleEditClassGroup = async (classGroupData) => {
  const response = await editClassGroup(classGroupData);
  console.log(response);
  if (response.ok) {
    toast.success("Class group updated successfully");
  } else {
    toast.error("Failed to update class group");
  }
};

export default function ClassDetailsDrawer({
  class_group,
  open,
  onClose,
  handleReloadData,
  students,
  subjects,
}) {
  const [editableClassGroup, setEditableClassGroup] = useState(class_group);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableClassGroup((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    handleEditClassGroup(editableClassGroup);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ backdropFilter: "blur(2px)" }}
    >
      <Box
        sx={{ width: 500, p: 3, height: "100%", backgroundColor: "#252525" }}
      >
        <Typography sx={{ color: "white" }} gutterBottom>
          Class Details
        </Typography>
        {editableClassGroup ? (
          <>
            <TextField
              label="Name"
              name="name"
              value={editableClassGroup.name}
              onChange={handleChange}
              fullWidth
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: "white" } }}
              InputProps={{ style: { color: "white" } }}
            />
            <TextField
              label="Description"
              name="description"
              value={editableClassGroup.description}
              onChange={handleChange}
              fullWidth
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: "white" } }}
              InputProps={{ style: { color: "white" } }}
            />
            <Typography sx={{ color: "white" }}>Students:</Typography>
            <Box>
              <List>
                {students.map(
                  (student) =>
                    editableClassGroup.students.includes(student.id) && (
                      <React.Fragment key={student.id}>
                        <StudentListCard
                          student={student}
                          removeStudent={removeStudent}
                        />
                        <Divider sx={{ backgroundColor: "#555" }} />
                      </React.Fragment>
                    )
                )}
              </List>
            </Box>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={handleSubmit}
            >
              Save Changes
            </Button>
          </>
        ) : (
          <Typography>No class selected.</Typography>
        )}
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
          onClick={handleReloadData}
        >
          Refresh Data
        </Button>
      </Box>
    </Drawer>
  );
}
