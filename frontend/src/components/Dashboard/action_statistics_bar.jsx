import { Box, Typography } from "@mui/material";
import React, { useState, useEffect } from "react";
import {
  FaChalkboardTeacher,
  FaClock,
  FaUser,
  FaTasks,
  FaExclamationTriangle,
  FaFile,
} from "react-icons/fa";
import {
  fetchTeacherStatistics,
  fetchStudentStatistics,
} from "../../utils/agent.js";
import { PrimaryButton } from "../../styles/buttons";
import { useAuth } from "../../contexts/auth_context.jsx";

export default function ActionStatisticsBar({
  page,
  actionFunction,
  actionText,
}) {
  const [statistics, setStatistics] = useState(null);
  const { auth } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      let response = null;
      if (auth.userType === "Teacher")
        response = await fetchTeacherStatistics(page);
      else response = await fetchStudentStatistics(page);
      console.log(response.data);
      setStatistics(response.data);
    };
    fetchData();
  }, [page]);

  // Define stats per page
  const pageStats = {
    dashboard: [
      {
        key: "total_students",
        label: "Students",
        icon: <FaUser color="white" />,
      },
      {
        key: "upcoming_classes",
        label: "Upcoming",
        icon: <FaClock color="white" />,
      },
      {
        key: "completed_classes",
        label: "Completed",
        icon: <FaClock color="white" />,
      },
      {
        key: "total_classes",
        label: "Completed",
        icon: <FaClock color="white" />,
      },
      auth.userType === "Teacher" && {
        key: "total_teaching_hours",
        label: "Completed",
        icon: <FaClock color="white" />,
        divisor: 60,
      },
      {
        key: "pending_assignments",
        label: "Pending Assignments",
        icon: <FaTasks color="white" />,
      },
    ],
    students: [
      {
        key: "total_students",
        label: "Total",
        icon: <FaUser color="white" />,
      },
      {
        key: "active_students",
        label: "Active",
        icon: <FaUser color="white" />,
      },
      {
        key: "inactive_students",
        label: "Inactive",
        icon: <FaUser color="white" />,
      },
      {
        key: "avg_assignments_per_student",
        label: "Avg Assignments",
        icon: <FaTasks color="white" />,
        fixed: 1,
      },
    ],
    classes: [
      {
        key: "total_class_groups",
        label: "Total",
        icon: <FaChalkboardTeacher color="white" />,
      },
      {
        key: "average_students_per_group",
        label: "Students/Group",
        icon: <FaUser color="white" />,
      },
    ],
    assignments: [
      {
        key: "total_assignments",
        label: "Total Assignments",
        icon: <FaTasks color="white" />,
      },
      {
        key: "total_documents",
        label: "Files",
        icon: <FaFile color="white" />,
      },
    ],
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: "2rem",
          marginTop: "1rem",
        }}
      >
        {auth.userType === "Teacher" && (
          <PrimaryButton
            onClick={() => actionFunction(true)}
            sx={{ minWidth: 200 }}
          >
            {actionText}
          </PrimaryButton>
        )}

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 3,
          }}
        >
          {statistics &&
            pageStats[page]?.map(({ key, label, icon, divisor, fixed }) => {
              let value = statistics[key];
              if (divisor) value = (value / divisor).toFixed(fixed || 0);
              if (value === undefined) return null;

              return (
                <Box
                  key={key}
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  {icon}
                  <Typography
                    sx={{ fontSize: "1.25rem", marginLeft: "0.5rem" }}
                  >
                    {value} {label}
                  </Typography>
                </Box>
              );
            })}
        </Box>
      </Box>
    </Box>
  );
}
