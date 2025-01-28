import React, { useState, useEffect } from "react";
import Navigation from "../components/main_navigation";
import { toast } from "react-toastify";
import ClassGroupCard from "../components/class_group_card";
import { useNavigate } from "react-router-dom";
import inputStyle from "../styles/input.jsx";

import {
  Container,
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Modal,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { fetchStudents, fetchSubjects } from "../utils/agent.js";
import StudentSearch from "../components/student_search.jsx";

function Classes() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    class_code: "",
  });
  const [showClassForm, setshowClassForm] = useState(false);
  const [classes, setClasses] = useState([]);
  const [name, setName] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [allStudents, setAllStudents] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const navigate = useNavigate();

  const handleCreateClassGroup = async (classGroupData) => {
    try {
      console.log(
        JSON.stringify({
          students: selectedStudents,
          subjects: selectedSubject,
          ...classGroupData,
        })
      );
      const auth = window.sessionStorage.getItem("token");
      const response = await fetch("http://localhost:8000/class-group/", {
        method: "POST",
        headers: {
          Authorization: `Token ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          students: selectedStudents,
          subjects: selectedSubject,
          ...classGroupData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create group");
      }

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error(error.message);
    }
  };

  const fetchData = async () => {
    const students = await fetchStudents(navigate);
    if (students) setAllStudents(students);
    console.log(students);
    const subjects = await fetchSubjects(navigate);
    if (subjects) setAllSubjects(subjects);
  };

  const fetchClasses = async () => {
    try {
      const auth = window.sessionStorage.getItem("token");
      const response = await fetch("http://localhost:8000/class-group", {
        method: "GET",
        headers: {
          Authorization: `Token ${auth}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch classes");
      }

      const data = await response.json();
      console.log(data);
      setClasses(data);
    } catch (error) {
      console.error(error.message);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const classGroupData = {
      ...formData,
      students: selectedStudents,
      subjects: selectedSubject,
    };

    const result = await handleCreateClassGroup(classGroupData);

    if (result.success) {
      toast.success(result.message);
      setIsOpen(false); // Close modal on success
      setFormData({
        name: "",
        description: "",
        class_code: "",
      });
      setSelectedStudents([]);
      setSelectedSubject("");
    } else {
      toast.error(result.message);
    }
  };

  return (
    <>
      <Navigation />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setshowClassForm(true)}
          sx={{ mb: 4 }}
        >
          Add New Class
        </Button>

        <Grid container spacing={2} className="cards-section">
          {classes.map((data) => {
            return (
              <Grid item xs={12} sm={6} md={4} key={data.id}>
                <ClassGroupCard data={data} />
              </Grid>
            );
          })}
        </Grid>
      </Container>

      <Modal
        open={showClassForm}
        onClose={() => setshowClassForm(false)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            backgroundColor: "#333",
            padding: 4,
            borderRadius: 2,
            boxShadow: 24,
            width: "900px",
            maxWidth: "90%",
            color: "white",
          }}
        >
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Name"
              variant="outlined"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
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
            {/* <FormControl fullWidth>
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
            </FormControl> */}

            <StudentSearch
              students={allStudents}
              classGroups={classes}
              selectedStudents={selectedStudents}
              setSelectedStudents={setSelectedStudents}
            ></StudentSearch>

            <TextField
              fullWidth
              label="Code"
              variant="outlined"
              value={formData.class_code}
              onChange={(e) =>
                setFormData({ ...formData, class_code: e.target.value })
              }
              sx={{ mb: 2, mt: 2, ...inputStyle }}
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

export default Classes;
