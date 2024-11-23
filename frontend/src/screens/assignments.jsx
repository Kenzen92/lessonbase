// Login.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Navigation from "../components/main_navigation";
import {
  Grid,
  Box,
  Typography,
  TextField,
  Button,
  Modal,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import AssignmentCard from "../components/assignment_card";
import AddAssignmentModal from "../components/add_assignment_modal.jsx";
import { fetchHomeworks } from "../utils/agent.js";

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

  useEffect(() => {
    const fetchData = async () => {
      const homeworks = await fetchHomeworks(navigate);
      if (homeworks) setHomeworks(homeworks);
    };
    fetchData();
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <Navigation />
      <AddAssignmentModal />
      <Box
        className="homework-dashboard"
        sx={{
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          marginTop: "1vh",
          p: 2,
        }}
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
                display: "flex",
                flexDirection: "column",
                textAlign: "center",
              }}
            >
              <Typography variant="h6">{column.name}</Typography>
              <Typography variant="body2" sx={{ marginBottom: 2 }}>
                {column.description}
              </Typography>
              <Box sx={{ flex: 1, overflowY: "auto" }}>
                <Box>
                  {homeworks && homeworks[column.name] ? (
                    homeworks[column.name].map((assignment, index) => (
                      <Box sx={{ m: 1 }}>
                        <AssignmentCard
                          assignment={assignment}
                          key={index}
                          handleReloadData={fetchHomeworks}
                        />
                      </Box>
                    ))
                  ) : (
                    <Typography>No homeworks available</Typography>
                  )}
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </>
  );
}

export default Assignments;
