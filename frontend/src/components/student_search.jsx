import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  Divider,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Button,
  Avatar,
} from "@mui/material";
import inputStyle from "../styles/input";

const StudentCard = ({ student, setSelectedStudents, selectedStudents }) => {
  return (
    <ListItem
      alignItems="flex-start"
      sx={{ px: 0, justifyContent: "space-between" }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Avatar alt={student.first_name} src={student.avatar} />
        <Typography sx={{ ...inputStyle }}>
          {student.first_name} {student.last_name}
        </Typography>
      </Box>
      <Box>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setSelectedStudents([...selectedStudents, student.id]);
          }}
        >
          Select
        </Button>
      </Box>
    </ListItem>
  );
};

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

  const studentAvatarList = selectedStudents.map((student, index) => (
    <Box
      key={index}
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Avatar alt={student.username} src={student.profile_picture}>
        {student.username ? student.username[0] : null}
      </Avatar>
      <Typography sx={{ ...inputStyle }}>
        {student.first_name} {student.last_name}
      </Typography>
      <Button
        variant="outlined"
        color="secondary"
        onClick={() => {
          setSelectedStudents(
            selectedStudents.filter((id) => id !== student.id)
          );
        }}
      >
        Remove
      </Button>
    </Box>
  ));

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        gap: "2em",
        maxHeight: "40em",
        overflow: "auto",
      }}
    >
      <Box sx={{ width: "50%" }}>
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

        {filteredStudents.length > 0 ? (
          <List>
            {filteredStudents.map((student) => (
              <React.Fragment key={student.id}>
                <StudentCard
                  student={student}
                  setSelectedStudents={setSelectedStudents}
                  selectedStudents={selectedStudents}
                />
                <Divider sx={{ backgroundColor: "#555" }} />
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography>No students found.</Typography>
        )}
      </Box>
      <Box sx={{ width: "50%" }}>
        <Typography>Selected Students: </Typography>
        {selectedStudents.length > 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              alignItems: "center",
            }}
          >
            {studentAvatarList}
          </Box>
        ) : (
          <Typography>No students Selected.</Typography>
        )}
      </Box>
    </Box>
  );
};

export default StudentSearch;
