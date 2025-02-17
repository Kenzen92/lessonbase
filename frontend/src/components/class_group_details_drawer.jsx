import React, { useState, useEffect } from "react";
import {
  Box,
  List,
  Divider,
  TextField,
  Button,
  Typography,
  Drawer,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import StudentListCard from "./student_list_card";
import { editClassGroup, fetchClassGroup } from "../utils/agent";
import { toast } from "react-toastify";
import inputStyle from "../styles/input";

const removeStudent = (studentId) => {
  console.log("Removing student with id: ", studentId);
};

const handleEditClassGroup = async (id, classGroupData) => {
  console.log("Editing class group with data: ", classGroupData);
  const response = await editClassGroup(id, classGroupData);
  if (response) {
    toast.success("Class group updated successfully");
  } else {
    toast.error("Failed to update class group");
  }
};

export default function ClassDetailsDrawer({
  classGroupId,
  open,
  onClose,
  handleReloadData,
  subjects,
}) {
  const [classGroup, setClassGroup] = useState(null);
  const [classSubjects, setClassSubjects] = useState([]);

  const fetchClassGroupData = async (id) => {
    const data = await fetchClassGroup(id);
    if (data) {
      setClassGroup(data);
      setClassSubjects(data.subjects.map((subject) => subject.id));
    } else {
      toast.error("Failed to fetch class group data");
    }
  };

  useEffect(() => {
    if (classGroupId) {
      fetchClassGroupData(classGroupId);
    }
  }, [classGroupId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setClassGroup((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const students = classGroup.students.map((student) => student.id);
    const updatedClassGroup = {
      ...classGroup,
      students,
      subjects: classSubjects, // Only IDs
    };
    const id = classGroup.id;
    delete updatedClassGroup.id;
    handleEditClassGroup(id, updatedClassGroup);
    handleReloadData();
  };

  const handleSubjectChange = (event) => {
    const selectedIds = event.target.value; // Already an array of IDs
    setClassSubjects(selectedIds);
    setClassGroup((prev) => ({
      ...prev,
      subjects: selectedIds, // Ensure it stores only IDs
    }));
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
        {classGroup ? (
          <Box sx={{ mt: 4 }}>
            <TextField
              label="Name"
              name="name"
              value={classGroup.name || ""}
              onChange={handleChange}
              fullWidth
              sx={{ ...inputStyle, mb: 2 }}
            />
            <TextField
              label="Description"
              name="description"
              value={classGroup.description || ""}
              onChange={handleChange}
              fullWidth
              sx={{ ...inputStyle, mb: 2 }}
            />
            <TextField
              label="Code"
              name="class_code"
              value={classGroup.class_code || ""}
              onChange={handleChange}
              fullWidth
              sx={{ ...inputStyle, mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel id="subject-select-label" sx={{ color: "#fff" }}>
                Subject
              </InputLabel>
              <Select
                id="subjects"
                labelId="subject-select-label"
                value={classSubjects}
                onChange={handleSubjectChange}
                multiple
                displayEmpty
                label="Subject"
                sx={{
                  color: "white",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#fff" },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#fff",
                  },
                  "& .MuiSelect-icon": { color: "#fff" },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: "#333",
                      color: "#fff",
                    },
                  },
                }}
              >
                {subjects.map((subject) => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography sx={{ mt: 4, color: "white" }}>Students:</Typography>
            <Box>
              <List>
                {classGroup.students &&
                  classGroup.students.map((student) => (
                    <React.Fragment key={student.id}>
                      <StudentListCard
                        student={student}
                        removeStudent={removeStudent}
                      />
                      <Divider sx={{ backgroundColor: "#555" }} />
                    </React.Fragment>
                  ))}
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
          </Box>
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
