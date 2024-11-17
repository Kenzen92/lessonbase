// Login.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import HomeworkCard from "../components/homework_card";
import Navigation from "../components/main_navigation";
import "../styles/dashboard.css";
import { Grid, Box, Typography } from "@mui/material";

function Assignments() {
  const [homeworks, setHomeworks] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const columns = [
    {
      name: "Overdue",
      color: "#400702",
      description: "Assignments that were due but not submitted in time.",
    },
    {
      name: "To Mark",
      color: "#FF8C00",
      description: "Assignments awaiting grading or feedback.",
    },
    {
      name: "Set",
      color: "#2F4F4F",
      description: "Newly set assignments that need to be reviewed.",
    },
    {
      name: "Upcoming",
      color: "#4682B4",
      description: "Assignments scheduled for the near future.",
    },
    {
      name: "Marked",
      color: "#006400",
      description: "Assignments that have been reviewed and marked.",
    },
  ];

  const fetchHomeworks = async () => {
    try {
      const auth = window.sessionStorage.getItem("token");
      const response = await fetch("http://localhost:8000/assignment ", {
        method: "GET",
        headers: {
          Authorization: `Token ${auth}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        handleUnautherizedRequest(navigate);
      }

      if (!response.ok) {
        throw new Error("Failed to fetch homework tasks");
      }

      const data = await response.json();
      setHomeworks(data); // Assuming the data is an array of homework objects
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchHomeworks();
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <Navigation />
      <Box
        className="homework-dashboard"
        sx={{ height: "95vh", display: "flex", flexDirection: "column" }}
      >
        <Grid container sx={{ height: "100%" }}>
          {columns.map((column, index) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              lg={3}
              xl={2.4}
              key={index}
              sx={{
                flex: 1,
                overflowY: "auto",
                border: "1px solid #ddd",
                padding: 2,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography variant="h6">{column.name}</Typography>
              <Typography variant="body2" sx={{ marginBottom: 2 }}>
                {column.description}
              </Typography>
              <Box sx={{ flex: 1, overflowY: "auto" }}>
                {/* Content for each column */}
                <Typography>Content goes here...</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </>
  );
}

export default Assignments;
