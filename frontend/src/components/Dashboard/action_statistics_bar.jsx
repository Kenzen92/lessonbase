import { Box, Typography } from "@mui/material";
import React, { useState, useEffect } from "react";
import { FaChalkboardTeacher, FaClock, FaUser } from "react-icons/fa";
import { fetchStatistics } from "../../utils/agent.js";
import { PrimaryButton } from "../../styles/buttons";
export default function ActionStatisticsBar({
  page,
  actionFunction,
  actionText,
}) {
  const [statistics, setStatistics] = useState(null);

  const fetchData = async () => {
    const statistics = await fetchStatistics(page);
    setStatistics(statistics.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Box sx={{ mt: 2 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          gap: "2rem",
          margin: "1rem",
        }}
      >
        <PrimaryButton onClick={() => actionFunction(true)}>
          {actionText}
        </PrimaryButton>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 3,
          }}
        >
          <Box
            sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}
            className="statistics-class-count"
          >
            <FaChalkboardTeacher style={{ color: "white", fontSize: "30px" }} />
            <Typography sx={{ fontSize: "1.25rem", marginLeft: "0.5rem" }}>
              {statistics && statistics["class_count"]} Classes
            </Typography>
          </Box>
          <Box
            sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}
            className="statistics-class-duration"
          >
            <FaClock style={{ color: "white", fontSize: "30px" }} />
            <Typography sx={{ fontSize: "1.25rem", marginLeft: "0.5rem" }}>
              {statistics && statistics["class_duration_total"] / 60} Hours
            </Typography>
          </Box>
          <Box
            sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}
            className="statistics-student-count"
          >
            <FaUser style={{ color: "white", fontSize: "30px" }} />
            {statistics && (
              <Typography sx={{ fontSize: "1.25rem", marginLeft: "0.5rem" }}>
                {statistics["student_count"] !== undefined &&
                statistics["student_count"] !== null &&
                statistics["student_count"] === 1
                  ? `${statistics["student_count"]} Student`
                  : `${statistics && statistics["student_count"]} Students`}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
