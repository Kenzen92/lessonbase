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
  Paper,
  Button,
  Chip,
} from "@mui/material";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import inputStyle from "../../styles/input";
import StudentSelectCard from "./student_select_card";

const StudentSearch = ({
  students,
  classGroups,
  selectedStudents,
  setSelectedStudents,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupFilters, setSelectedGroupFilters] = useState([]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleGroupFilterChange = (event, groupId) => {
    setSelectedGroupFilters((prev) =>
      event.target.checked
        ? [...prev, groupId]
        : prev.filter((id) => id !== groupId)
    );
  };

  const handleToggleGroupStudents = (groupId, select) => {
    const studentsInGroup = students
      .filter((student) =>
        student.class_groups.some((group) => group.id === groupId)
      )
      .map((student) => student.id);

    if (select) {
      // Select all students in the group (add only those not already selected)
      const newSelections = studentsInGroup.filter(
        (id) => !selectedStudents.includes(id)
      );
      setSelectedStudents([...selectedStudents, ...newSelections]);
    } else {
      // Deselect all students in the group
      setSelectedStudents(
        selectedStudents.filter((id) => !studentsInGroup.includes(id))
      );
    }
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredStudents.map((s) => s.id);
    const newSelections = allFilteredIds.filter(
      (id) => !selectedStudents.includes(id)
    );
    setSelectedStudents([...selectedStudents, ...newSelections]);
  };

  const handleDeselectAll = () => {
    const allFilteredIds = filteredStudents.map((s) => s.id);
    setSelectedStudents(
      selectedStudents.filter((id) => !allFilteredIds.includes(id))
    );
  };

  const filteredStudents = students.filter((student) => {
    const firstName = student.first_name || "";
    const lastName = student.last_name || "";
    const username = student.username || "";
    const email = student.email || "";

    const matchesSearch =
      firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGroup =
      selectedGroupFilters.length === 0 ||
      student.class_groups.some((group) =>
        selectedGroupFilters.includes(group.id)
      );

    return matchesSearch && matchesGroup;
  });

  const selectedCount = filteredStudents.filter((s) =>
    selectedStudents.includes(s.id)
  ).length;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        minHeight: "500px",
      }}
    >
      {/* Search and Filter Section */}
      <Box>
        <TextField
          label="Search by name, username, or email"
          variant="outlined"
          value={searchQuery}
          onChange={handleSearchChange}
          fullWidth
          sx={{ ...inputStyle, mb: 3 }}
        />

        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ mb: 1.5, fontWeight: 500 }}>
            Filter by Class Group:
          </Typography>
          <FormGroup sx={{ flexDirection: "row", gap: 1, flexWrap: "wrap" }}>
            {classGroups.map((group) => {
              const studentsInGroup = students.filter((student) =>
                student.class_groups.some((g) => g.id === group.id)
              );
              const selectedInGroup = studentsInGroup.filter((student) =>
                selectedStudents.includes(student.id)
              ).length;
              const allSelected = selectedInGroup === studentsInGroup.length;
              const someSelected =
                selectedInGroup > 0 && selectedInGroup < studentsInGroup.length;

              return (
                <Paper
                  key={group.id}
                  sx={{
                    p: 1.5,
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    minWidth: "180px",
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedGroupFilters.includes(group.id)}
                        onChange={(event) =>
                          handleGroupFilterChange(event, group.id)
                        }
                        sx={{ color: "#fff" }}
                      />
                    }
                    label={
                      <Box>
                        <Typography sx={{ fontWeight: 500 }}>
                          {group.name}
                        </Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: "#999" }}>
                          {selectedInGroup}/{studentsInGroup.length} selected
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleToggleGroupStudents(group.id, true)}
                      disabled={allSelected}
                      sx={{
                        flex: 1,
                        fontSize: "0.7rem",
                        py: 0.5,
                        color: "#00b0ff",
                        borderColor: "#00b0ff",
                      }}
                    >
                      Select All
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleToggleGroupStudents(group.id, false)}
                      disabled={selectedInGroup === 0}
                      sx={{
                        flex: 1,
                        fontSize: "0.7rem",
                        py: 0.5,
                        color: "#ff5252",
                        borderColor: "#ff5252",
                      }}
                    >
                      Deselect All
                    </Button>
                  </Box>
                </Paper>
              );
            })}
          </FormGroup>
        </Box>
      </Box>

      {/* Selection Summary and Actions */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2,
          backgroundColor: "rgba(0, 176, 255, 0.1)",
          borderRadius: "8px",
        }}
      >
        <Typography sx={{ fontWeight: 500 }}>
          {selectedCount} of {filteredStudents.length} students selected
          {selectedStudents.length > selectedCount &&
            ` (${selectedStudents.length} total)`}
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            size="small"
            onClick={handleSelectAll}
            disabled={selectedCount === filteredStudents.length}
            sx={{ backgroundColor: "#00b0ff" }}
          >
            Select All Visible
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleDeselectAll}
            disabled={selectedCount === 0}
            sx={{ color: "#ff5252", borderColor: "#ff5252" }}
          >
            Deselect All Visible
          </Button>
        </Box>
      </Box>

      {/* Student List */}
      <Box sx={{ flex: 1, overflowY: "auto", maxHeight: "400px" }}>
        {filteredStudents.length > 0 ? (
          <List sx={{ p: 0 }}>
            {filteredStudents.map((student, index) => (
              <React.Fragment key={student.id}>
                <StudentSelectCard
                  student={student}
                  setSelectedStudents={setSelectedStudents}
                  selectedStudents={selectedStudents}
                />
                {index < filteredStudents.length - 1 && (
                  <Divider
                    sx={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  />
                )}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box
            sx={{
              textAlign: "center",
              py: 8,
              color: "#999",
            }}
          >
            <Typography variant="h6">No students found.</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Try adjusting your search or filters.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default StudentSearch;
