import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Button,
} from "@mui/material";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import inputStyle from "../styles/input";

const StudentCard = ({
  student,
  setSelectedStudents,
  selectedStudents,
  isSelected,
}) => {
  return (
    <>
      <ListItem alignItems="flex-start" sx={{ px: 0, justifyContent: "space-between" }}>
        <Box sx={{ flexDirection: "row" }}>
          <Box>
            <Avatar alt={student.first_name} src={student.avatar} />
          </Box>
          <Typography
            sx={{ ...inputStyle }}
          >{`${student.first_name} ${student.last_name}`}</Typography>
          <Typography
            sx={{ ...inputStyle }}
          >{`Username: ${student.username} | Email: ${student.email}`}</Typography>
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
    </>
  );
};

// I have a way to view students filter and search by name or class etc.
// A student selected here should vanish from the list and appear to the right in a 'selected' state.
// The parent component needs to control this list so as to return it through form submission.

// If i pass in selected students and setSelected students, the parent can manage state
// But the child can be responsible for managing it

// I can now add students to the selected students list. Each student needs an attribute for selected (default to false)

// When setting a student into the selected list, they should be excluded from the selectable list.

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
    <Box key={index} sx={{display: 'flex', flexDirection: 'row', alignItems: 'space-between'}}>
      <Avatar alt={student.username} src={student.profile_picture} key={student.id}>
        {student.username ? student.username[0] : null}
      </Avatar>
      <Button
        variant="outlined"
        color="secondary"
        onClick={() => {
          let filteredStudents = [];
          for (let eachStudent of selectedStudents) {
            if (eachStudent !== student) {
              filteredStudents.push(eachStudent);
            }
          }
          setSelectedStudents([...filteredStudents]);
        }}
        >
        Remove
      </Button>
    </Box>
  ));

  return (
    <Box
      sx={{
        p: 3,
        boxShadow: 5,
        borderRadius: 2,
        border: 2,
        color: "#fff",
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: "5em",
      }}
    >
      <Box sx={{ width: '70%'}}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Student Search
        </Typography>

        <TextField
          label="Search by name, username, or email"
          variant="outlined"
          value={searchQuery}
          onChange={handleSearchChange}
          fullWidth
          sx={{ ...inputStyle }}
        />

        <Typography variant="body1" sx={{ mb: 1 }}>
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
                  isSelected={selectedStudents.includes(student.id)}
                />
                <Divider sx={{ backgroundColor: "#555" }} />
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography>No students found.</Typography>
        )}
      </Box>
      <Box>
        <Typography>Selected Students: </Typography>
        {selectedStudents.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: 'column', gap: 1, alignItems: "center" }}>
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
