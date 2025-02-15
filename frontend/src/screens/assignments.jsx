import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Navigation from "../components/main_navigation";
import { Grid, Box, Typography, Container, Tooltip } from "@mui/material";
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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
          <Grid container spacing={2} sx={{ height: "100%" }}>
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
                  display: "flex",
                  flexDirection: "column",
                  textAlign: "center",
                  marginTop: "1em",
                  minHeight: "15em",
                }}
              >
                <Tooltip title={column.description} arrow>
                  <Box
                    sx={{
                      backgroundColor: column.color,
                      color: "#fff",
                      padding: "0.5em",
                      borderRadius: "4px 4px 0 0",
                    }}
                  >
                    <Typography variant="h6">{column.name}</Typography>
                  </Box>
                </Tooltip>
                <Box
                  sx={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "1em",
                    backgroundColor: "#f9f9f9",
                    borderRadius: "0 0 4px 4px",
                  }}
                >
                  {homeworks && homeworks[column.name] ? (
                    homeworks[column.name].map((assignment, index) => (
                      <Box sx={{ m: 1 }} key={index}>
                        <AssignmentCard
                          assignment={assignment}
                          handleReloadData={fetchHomeworks}
                        />
                      </Box>
                    ))
                  ) : (
                    <Typography>No homeworks available</Typography>
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </>
  );
}

export default Assignments;
