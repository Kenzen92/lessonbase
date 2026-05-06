import React, { useState, useEffect } from "react";
import { Box, TextField, Typography } from "@mui/material";
import inputStyle from "../../styles/input";
import { PrimaryButton, SecondaryButton } from "../../styles/buttons.jsx";

function StudentListSearch({ setFilteredStudents, allStudents }) {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    const filteredStudents = allStudents.filter((student) =>
      [
        `${student.first_name.toLowerCase()} ${student.last_name.toLowerCase()}`,
        student.first_name.toLowerCase(),
        student.last_name.toLowerCase(),
        student.username?.toLowerCase(),
      ].some((field) => field.includes(lowerCaseSearch))
    );

    setFilteredStudents(filteredStudents);
  }, [searchTerm, allStudents]);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: 2,
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <TextField
          sx={{ ...inputStyle, maxWidth: 350, marginLeft: "auto" }}
          label="Search student"
          variant="outlined"
          fullWidth
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Box>
    </Box>
  );
}

export default StudentListSearch;
