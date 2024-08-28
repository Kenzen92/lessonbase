import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/schedule_class_modal.css";
import { toast } from "react-toastify";
import BasicDateTimePicker from "./dateTimePicker";
import BasicTimePicker from "./timePicker";
import {
  Box,
  Modal,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Input,
  Select,
  MenuItem,
  Divider,
} from "@mui/material";

const ScheduleClassModal = ({ handleReloadData }) => {
  const [startTime, setStartTime] = useState("");
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [allStudents, setAllStudents] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [error, setError] = useState(null);
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const navigate = useNavigate();
  const toggleModal = () => {
    handleClose();
  };

  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "20rem",
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
    padding: 5,
  };

  // Define fetchClassEvents function
  const fetchStudents = async () => {
    try {
      const auth = window.sessionStorage.getItem("token");
      const response = await fetch("http://localhost:8000/students", {
        method: "GET",
        headers: {
          Authorization: `Token ${auth}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status == 401) {
        handleUnautherizedRequest(navigate);
      }

      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      const data = await response.json();
      setAllStudents(data);
    } catch (error) {
      setError(error.message);
    }
  };

  const fetchSubjects = async () => {
    try {
      const auth = window.sessionStorage.getItem("token");
      const response = await fetch("http://localhost:8000/subjects", {
        method: "GET",
        headers: {
          Authorization: `Token ${auth}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch subjects");
      }

      const data = await response.json();
      setAllSubjects(data);
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    const now = new Date().toISOString().slice(0, 16);
    setStartTime(now);
    fetchStudents();
    fetchSubjects();
  }, []);

  // Function to handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    const url = "http://localhost:8000/class/";
    // Construct the class object to be submitted

    const selectedSubjectObj = allSubjects.find(
      (subject) => subject.id === parseInt(selectedSubject)
    );

    const newClass = {
      start_time: startTime,
      start_date: startDate,
      duration: duration,
      students: selectedStudents,
      subject: selectedSubjectObj["name"],
    };
    console.log(newClass);

    try {
      const auth = window.sessionStorage.getItem("token");
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Token ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newClass),
      });

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.log("Error: " + error.message);
    }

    // Close the modal after submission
    toast.success("The class event was scheduled");
    handleReloadData();
    toggleModal();
  };

  const studentSelector = () => {
    return (
      <FormControl sx={{ width: "100%", maxWidth: "15rem", marginTop: "1rem" }}>
        <InputLabel id="demo-simple-select-label">Students</InputLabel>
        <Select
          id="students"
          multiple
          value={selectedStudents}
          onChange={(e) => setSelectedStudents(e.target.value)}
          required
          className="form-input"
        >
          {allStudents.map((student) => (
            <MenuItem key={student.id} value={student.id}>
              {student.username}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  };

  const subjectSelector = () => {
    return (
      <FormControl sx={{ width: "100%", maxWidth: "15rem", marginTop: "1rem" }}>
        <InputLabel id="subject-select-label">Subject</InputLabel>
        <Select
          id="subjects"
          labelId="subject-select-label"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)} // Handle the selected subject ID
          required
          className="form-input"
        >
          {allSubjects.map((subject) => (
            <MenuItem key={subject.id} value={subject.id}>
              {subject.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  };

  const handleDurationChange = (event) => {
    setDuration(event.target.value);
  };

  return (
    <div>
      <button onClick={handleOpen}>Schedule Class</button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        className="schedule-class-overlay"
      >
        <Box sx={style}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography
              id="modal-modal-title"
              variant="h6"
              component="h2"
              sx={{ color: "black" }}
            >
              Schedule class
            </Typography>
            <Button onClick={handleClose}>Close</Button>
          </Box>

          <FormControl sx={{ maxWidth: "15rem", marginTop: "1rem" }}>
            <BasicDateTimePicker
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              label="Date & Time"
            />
          </FormControl>

          <FormControl sx={{ maxWidth: "15rem", marginTop: "1rem" }}>
            <BasicTimePicker
              value={startTime}
              onChange={(newValue) => setStartTime(newValue)}
              label="Time"
              fullWidth
            />
          </FormControl>
          <FormControl
            sx={{ width: "100%", maxWidth: "15rem", marginTop: "1rem" }}
          >
            <InputLabel htmlFor="duration-input">Duration</InputLabel>
            <Select
              id="duration-select"
              value={duration}
              onChange={handleDurationChange}
            >
              <MenuItem value={0}>0 minutes</MenuItem>
              <MenuItem value={15}>15 minutes</MenuItem>
              <MenuItem value={30}>30 minutes</MenuItem>
              <MenuItem value={45}>45 minutes</MenuItem>
              <MenuItem value={60}>60 minutes</MenuItem>
              <MenuItem value={75}>75 minutes</MenuItem>
              <MenuItem value={90}>90 minutes</MenuItem>
            </Select>
          </FormControl>
          {studentSelector()}
          {subjectSelector()}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              marginTop: "2rem",
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit} // Call your submit handler function
            >
              Submit
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default ScheduleClassModal;
