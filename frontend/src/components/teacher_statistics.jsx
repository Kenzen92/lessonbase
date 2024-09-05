import { Box, Typography } from "@mui/material";
import React, { useState } from "react";
import { FaChalkboardTeacher, FaClock, FaUser } from "react-icons/fa";
import "./../styles/TeacherStatistics.css";

export default function teacher_statistics({ statistics }) {
  const [error, setError] = useState(null);

  return (
    <Box className="statistics-bar">
      {statistics ? (
        <>
          <Box className="statistics-class-count">
            <FaChalkboardTeacher style={{ color: "white", fontSize: "20px" }} />
            <Typography>{statistics["class_count"]}</Typography>
          </Box>
          <Box className="statistics-class-duration">
            <FaClock style={{ color: "white", fontSize: "20px" }} />
            <Typography>{statistics["class_duration_total"]}</Typography>
          </Box>
          <Box className="statistics-student-count">
            <FaUser style={{ color: "white", fontSize: "20px" }} />
            <Typography>{statistics["student_count"]}</Typography>
          </Box>
        </>
      ) : null}
    </Box>
  );
}
