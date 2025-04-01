import React, { useState, useEffect } from "react";
import { Box, TextField, Typography } from "@mui/material";
import inputStyle from "../../styles/input";

function ClassEventSearchAndFilter({
  allClassEvents,
  previous,
  setPrevious,
  setFilteredClassEvents,
}) {
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredClassEvents(allClassEvents);
      return;
    }
    const lowerCaseSearch = searchTerm.toLowerCase();
    const filtered = allClassEvents.filter(
      (event) =>
        event.students.some((student) =>
          [
            `${student.first_name.toLowerCase()} ${student.last_name.toLowerCase()}`,
            student.first_name.toLowerCase(),
            student.last_name.toLowerCase(),
            student.username?.toLowerCase(), // Ensure username exists before calling toLowerCase()
          ].some((field) => field.includes(lowerCaseSearch))
        ) || event.subject.name.toLowerCase().includes(lowerCaseSearch)
    );
    setFilteredClassEvents(filtered);
  }, [searchTerm, allClassEvents]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        gap: 2,
        width: "100%",
        alignItems: "center",
      }}
    >
      <TextField
        sx={{ ...inputStyle, maxWidth: 350, marginLeft: "auto" }}
        label="Search student, or subject"
        variant="outlined"
        fullWidth
        size="small"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {/* Render filtered results here (optional) */}
    </Box>
  );
}

export default ClassEventSearchAndFilter;
