// Login.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import HomeworkCard from "../components/homework_card";
import Navigation from "../components/main_navigation";
import "../styles/dashboard.css";
import { Grid, Box, Typography, TextField, Button, Modal, InputLabel, Select, MenuItem } from "@mui/material";
import AssignmentCard from "../components/assignment_card";
import { fetchStudents, fetchSubjects, fetchHomeworks } from "../utils/agent.js";

function Assignments() {
  const [homeworks, setHomeworks] = useState([]);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ title: "", dueDate: "" });
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [allStudents, setAllStudents] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
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
  const inputStyle = {
    "& .MuiOutlinedInput-root": {
        color: "#fff", // Text color
        "& fieldset": {
            borderColor: "#fff", // Border color
        },
        "&:hover fieldset": {
            borderColor: "#fff", // Hover border color
        },
    },
    "& .MuiInputLabel-root": {
        color: "#fff", // Label color
    },
    "& .MuiSvgIcon-root": {
        color: "#fff", // Icon color
    },
}

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
      setIsOpen(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const students = await fetchStudents(navigate);
      if (students) setAllStudents(students);

      const subjects = await fetchSubjects(navigate);
      if (subjects) setAllSubjects(subjects);

      const homeworks = await fetchHomeworks(navigate);
      if (homeworks) setHomeworks(homeworks);
    }
    fetchData();
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
        <Box sx={{ maxWidth: '20rem', marginTop: '1rem', marginBottom: '0.5rem', p: 1, marginLeft: 'auto' }}>
          <Button
            onClick={() => setIsOpen(true)}
            variant="outlined"
            sx={{
              color: "white",
              borderColor: "white",
              width: "100%",
            }}
          >+ Add Assignment</Button>
        </Box>

        <Modal
          open={isOpen}
          onClose={() => setIsOpen(false)}
          aria-labelledby="create-assignment-modal"
          aria-describedby="form-to-create-assignment"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              bgcolor: "#333",
              padding: 4,
              borderRadius: 2,
              boxShadow: 24,
              width: { xs: "90%", sm: "70%", md: "50%" },
              color: "#fff",
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
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                sx={{ ...inputStyle, mb: 2 }}
              />
              <TextField
                fullWidth
                label="Description"
                variant="outlined"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                sx={{ ...inputStyle, mb: 2 }}
              />
              <InputLabel id="subject-select-label" sx={{ color: "#fff" }}>
                Subject
              </InputLabel>
              <Select
                id="subjects"
                labelId="subject-select-label"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                label="Subject"
                sx={{ ...inputStyle, mb: 2 }}
              >
                {allSubjects.map((subject) => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
              <InputLabel id="student-select-label" sx={{ color: "#fff" }}>
                Students
              </InputLabel>
              <Select
                id="students"
                labelId="student-select-label"
                multiple
                value={selectedStudents}
                onChange={(e) => setSelectedStudents(e.target.value)}
                label="Students"
                sx={{ ...inputStyle, mb: 2 }}
              >
                {allStudents.map((student) => (
                  <MenuItem key={student.id} value={student.id}>
                    {student.name}
                  </MenuItem>
                ))}
              </Select>
              <TextField
                fullWidth
                label="Max Score"
                type="number"
                variant="outlined"
                value={formData.max_score}
                onChange={(e) =>
                  setFormData({ ...formData, max_score: e.target.value })
                }
                sx={{ ...inputStyle, mb: 2 }}
              />
              <TextField
                fullWidth
                label="Due Date"
                type="datetime-local"
                variant="outlined"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                sx={{ ...inputStyle, mb: 2 }}
              />
              <Button
                type="submit"
                variant="contained"
                sx={{
                  width: "100%",
                  bgcolor: "#fff",
                  color: "darkgrey",
                  "&:hover": {
                    bgcolor: "#ddd",
                  },
                }}
              >
                Submit
              </Button>
            </form>
          </Box>
        </Modal>

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
                textAlign: 'center'
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
