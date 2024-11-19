// Login.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import HomeworkCard from "../components/homework_card";
import Navigation from "../components/main_navigation";
import "../styles/dashboard.css";
import { Grid, Box, Typography, TextField, Button } from "@mui/material";
import AssignmentCard from "../components/assignment_card";

function Assignments() {
  const [homeworks, setHomeworks] = useState([]);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ title: "", dueDate: "" });
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
      console.log(data);
      setHomeworks(data); // Assuming the data is an array of homework objects
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    const auth = window.sessionStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:8000/assignment/", {
        method: "POST",
        headers: {
          Authorization: `Token ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create assignment");
      }

      toast.success("Assignment created successfully!");
      setFormData({ title: "", dueDate: "" }); // Reset form
      fetchHomeworks(); // Refresh the list
      setOpen(false);
    } catch (error) {
      toast.error(error.message);
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
        sx={{ height: "93vh", display: "flex", flexDirection: "column" }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            border: "2px solid white",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            color: "white",
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            Create New Assignment
          </Typography>
          <form onSubmit={handleCreateAssignment}>
            <TextField
              fullWidth
              label="Title"
              variant="outlined"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              InputLabelProps={{
                style: { color: "white" },
              }}
              InputProps={{
                style: { color: "white", borderColor: "white" },
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Due Date"
              type="date"
              variant="outlined"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              InputLabelProps={{
                shrink: true,
                style: { color: "white" },
              }}
              InputProps={{
                style: { color: "white", borderColor: "white" },
              }}
              sx={{ mb: 2 }}
            />
            <Button
              type="submit"
              variant="outlined"
              sx={{
                color: "white",
                borderColor: "white",
                width: "100%",
              }}
            >
              Submit
            </Button>
          </form>
        </Box>
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

                <Box>
                  {homeworks && homeworks[column.name] ? (
                    homeworks[column.name].map((assignment, index) => (
                      <AssignmentCard assignment={assignment} key={index} handleReloadData={fetchHomeworks} />
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
