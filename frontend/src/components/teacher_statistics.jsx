import { Box, Typography } from "@mui/material";
import React, { useState } from "react";
import { FaChalkboardTeacher, FaClock, FaUser } from "react-icons/fa";

export default function TeacherStatistics({ statistics }) {
  const [error, setError] = useState(null);

  return (
    <Box className="statistics-bar">
      {statistics ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            gap: "2rem",
            margin: "1rem",
          }}
        >
          <Box
            sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}
            className="statistics-class-count"
          >
            <FaChalkboardTeacher style={{ color: "white", fontSize: "30px" }} />
            <Typography sx={{ fontSize: "1.25rem", marginLeft: "0.5rem" }}>
              {statistics["class_count"]} Classes
            </Typography>
          </Box>
          <Box
            sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}
            className="statistics-class-duration"
          >
            <FaClock style={{ color: "white", fontSize: "30px" }} />
            <Typography sx={{ fontSize: "1.25rem", marginLeft: "0.5rem" }}>
              {statistics["class_duration_total"] / 60} Hours
            </Typography>
          </Box>
          <Box
            sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}
            className="statistics-student-count"
          >
            <FaUser style={{ color: "white", fontSize: "30px" }} />
            <Typography sx={{ fontSize: "1.25rem", marginLeft: "0.5rem" }}>
              {statistics["student_count"] === 1
                ? `${statistics["student_count"]} Student`
                : `${statistics["student_count"]} Students`}
            </Typography>
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
