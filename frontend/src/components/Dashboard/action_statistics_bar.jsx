import { Box, Typography } from "@mui/material";
import React, { useState } from "react";
import {
  FaChalkboardTeacher,
  FaClock,
  FaUser,
  FaTasks,
  FaExclamationTriangle,
  FaFile,
  FaFlask,
} from "react-icons/fa";
import { PrimaryButton, SecondaryButton } from "../../styles/buttons";
import { useAuth } from "../../contexts/auth_context.jsx";
import { useStatistics } from "../../contexts/statistics_context.jsx";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

export default function ActionStatisticsBar({
  page,
  actionFunction,
  actionText,
}) {
  const { auth } = useAuth();
  const { statistics } = useStatistics();
  const navigate = useNavigate();
  const [creatingPractice, setCreatingPractice] = useState(false);

  const handleCreatePracticeClassroom = async () => {
    setCreatingPractice(true);
    try {
      const token = window.sessionStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/classroom/practice/create/`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();

      if (response.ok) {
        navigate(`/interactive-classroom/${data.access_token}`);
      } else {
        console.error("Failed to create practice classroom:", data.error);
        alert(data.error || "Failed to create practice classroom");
      }
    } catch (err) {
      console.error("Error creating practice classroom:", err);
      alert("Failed to create practice classroom. Please try again.");
    } finally {
      setCreatingPractice(false);
    }
  };

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
      auth.userType === "teacher" && {
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
        <Box sx={{ display: "flex", gap: 2 }}>
          {auth.userType === "teacher" && (
            <>
              <PrimaryButton
                onClick={() => actionFunction(true)}
                sx={{ minWidth: 200 }}
              >
                {actionText}
              </PrimaryButton>
              {page === "dashboard" && (
                <SecondaryButton
                  onClick={handleCreatePracticeClassroom}
                  disabled={creatingPractice}
                  startIcon={<FaFlask />}
                  sx={{ minWidth: 200 }}
                >
                  {creatingPractice ? "Creating..." : "Practice Classroom"}
                </SecondaryButton>
              )}
            </>
          )}
        </Box>

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
              if (
                auth.userType !== "Teacher" &&
                key === "total_teaching_hours"
              ) {
                return null;
              }
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
