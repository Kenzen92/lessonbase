import { handleCreateAssignment } from "../utils/agent";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  FormControl,
} from "@mui/material";
import { fetchStudents, fetchSubjects } from "../utils/agent.js";
import { toast } from "react-toastify";
import inputStyle from "../styles/input.jsx";

function AddAssignmentModal() {
  const [formData, setFormData] = useState({ title: "", due_date: "" });
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [allStudents, setAllStudents] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const students = await fetchStudents(navigate);
      if (students) setAllStudents(students);
      console.log(students);

      const subjects = await fetchSubjects(navigate);
      if (subjects) setAllSubjects(subjects);
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const assignmentData = {
      ...formData,
      students: selectedStudents,
      subject: selectedSubject,
    };

    const result = await handleCreateAssignment(assignmentData);

    if (result.success) {
      toast.success(result.message);
      setIsOpen(false); // Close modal on success
      setFormData({
        title: "",
        description: "",
        max_score: "",
        due_date: "",
      });
      setSelectedStudents([]);
      setSelectedSubject("");
    } else {
      toast.error(result.message);
    }
  };

  return (
    <>
      <Box sx={{ maxWidth: "20rem", marginTop: "1rem", marginLeft: "auto" }}>
        <Button
          onClick={() => setIsOpen(true)}
          variant="outlined"
          sx={{
            color: "white",
            borderColor: "white",
            width: "100%",
          }}
        >
          + Add Assignment
        </Button>
      </Box>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        aria-labelledby="create-assignment-modal"
        aria-describedby="form-to-create-assignment"
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box
          sx={{
            bgcolor: "#333",
            padding: 4,
            borderRadius: 2,
            boxShadow: 24,
            width: { xs: "90%", sm: "70%", md: "50%", lg: "30%" },
            color: "#fff",
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}>
            Create New Assignment
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Title"
              variant="outlined"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              sx={{ mb: 2, ...inputStyle }}
            />
            <TextField
              fullWidth
              label="Description"
              variant="outlined"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              sx={{ mb: 2, ...inputStyle }}
            />
            <FormControl fullWidth>
              <InputLabel id="subject-select-label" sx={{ color: "#fff" }}>
                Subject
              </InputLabel>
              <Select
                id="subjects"
                labelId="subject-select-label"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                label="Subject"
                sx={{
                  mb: 2,
                  ...inputStyle,
                }}
              >
                {allSubjects.map((subject) => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="student-select-label" sx={{ color: "#fff" }}>
                Students
              </InputLabel>
              <Select
                labelId="student-select-label"
                id="students"
                multiple
                value={selectedStudents}
                onChange={(e) => setSelectedStudents(e.target.value)}
                label="Students"
                sx={{
                  mb: 2,
                  ...inputStyle,
                }}
              >
                {allStudents.map((student) => (
                  <MenuItem key={student.id} value={student.id}>
                    {student.username}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Max Score"
              type="number"
              variant="outlined"
              value={formData.max_score}
              onChange={(e) =>
                setFormData({ ...formData, max_score: e.target.value })
              }
              sx={{ mb: 2, ...inputStyle }}
            />
            <TextField
              fullWidth
              label="Due Date"
              type="date"
              variant="outlined"
              value={formData.due_date}
              onChange={(e) =>
                setFormData({ ...formData, due_date: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, ...inputStyle }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{
                width: {
                  sm: "100%",
                  lg: "50%",
                },
              }}
            >
              Submit
            </Button>
          </form>
        </Box>
      </Modal>
    </>
  );
}

export default AddAssignmentModal;
