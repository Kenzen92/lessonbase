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
            <Typography>{statistics["class_count"]} Classes</Typography>
          </Box>
          <Box className="statistics-class-duration">
            <FaClock style={{ color: "white", fontSize: "20px" }} />
            <Typography>
              {statistics["class_duration_total"] / 60} Hours
            </Typography>
          </Box>
          <Box className="statistics-student-count">
            <FaUser style={{ color: "white", fontSize: "20px" }} />
            <Typography>
              {statistics["student_count"] == 1
                ? `${statistics["student_count"]} Student`
                : `${statistics["student_count"]} Students`}
            </Typography>
          </Box>
        </>
      ) : null}
    </Box>
  );
}
