import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  List,
  Divider,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from "@mui/material";
import inputStyle from "../styles/input";
import StudentSelectCard from "./student_select_card";

const StudentSearch = ({
  students,
  classGroups,
  selectedStudents,
  setSelectedStudents,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroups, setSelectedGroups] = useState([]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleGroupChange = (event, groupId) => {
    setSelectedGroups((prev) =>
      event.target.checked
        ? [...prev, groupId]
        : prev.filter((id) => id !== groupId)
    );
  };

  const filteredStudents = students.filter((student) => {
    const firstName = student.first_name || "";
    const lastName = student.last_name || "";
    const username = student.username || "";
    const email = student.email || "";

    const isSelected = selectedStudents.includes(student.id);
    const matchesSearch =
      firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGroup =
      selectedGroups.length === 0 ||
      student.class_groups.some((group) => selectedGroups.includes(group.id));

    return matchesSearch && matchesGroup && !isSelected;
  });

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "2em",
        height: "30rem",
        overflow: "auto",
      }}
    >
      <Box sx={{ width: "100%" }}>
        <TextField
          label="Search by name, username, or email"
          variant="outlined"
          value={searchQuery}
          onChange={handleSearchChange}
          fullWidth
          sx={{ ...inputStyle }}
        />

        <Typography variant="body1" sx={{ mt: 2, mb: 1 }}>
          Filter by Class Groups:
        </Typography>
        <FormGroup sx={{ mb: 3 }}>
          {classGroups.map((group) => (
            <FormControlLabel
              key={group.id}
              control={
                <Checkbox
                  checked={selectedGroups.includes(group.id)}
                  onChange={(event) => handleGroupChange(event, group.id)}
                  sx={{ color: "#fff" }}
                />
              }
              label={group.name}
            />
          ))}
        </FormGroup>
      </Box>
      <Box
        sx={{ width: "100%", display: "flex", flexDirection: "row", gap: 5 }}
      >
        {filteredStudents.length > 0 ? (
          <Box sx={{ width: "50%" }}>
            <List>
              {filteredStudents.map((student) => (
                <React.Fragment key={student.id}>
                  <StudentSelectCard
                    student={student}
                    setSelectedStudents={setSelectedStudents}
                    selectedStudents={selectedStudents}
                  />
                  <Divider sx={{ backgroundColor: "#555" }} />
                </React.Fragment>
              ))}
            </List>
          </Box>
        ) : (
          <Box sx={{ width: "50%" }}>
            <Typography sx={{ textAlign: "center" }}>
              No students found.
            </Typography>
          </Box>
        )}
        <Box sx={{ width: "50%" }}>
          {selectedStudents.length > 0 ? (
            <List>
              {students
                .filter((student) => selectedStudents.includes(student.id))
                .map((student) => (
                  <React.Fragment key={student.id}>
                    <StudentSelectCard
                      student={student}
                      setSelectedStudents={setSelectedStudents}
                      selectedStudents={selectedStudents}
                    />
                    <Divider sx={{ backgroundColor: "#555" }} />
                  </React.Fragment>
                ))}
            </List>
          ) : (
            <Typography sx={{ textAlign: "center" }}>
              No students Selected.
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default StudentSearch;
