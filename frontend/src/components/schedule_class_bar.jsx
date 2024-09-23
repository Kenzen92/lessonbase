import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/schedule_class_bar.css";
import { toast } from "react-toastify";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { MobileTimePicker } from "@mui/x-date-pickers/MobileTimePicker";
import {
  Box,
  Modal,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import { FaPlus } from "react-icons/fa";
import dayjs from "dayjs"; // Dayjs import

const ScheduleClassBar = ({ handleReloadData, classData }) => {
  const [startDate, setStartDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [allStudents, setAllStudents] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [error, setError] = useState(null);
  const [open, setOpen] = React.useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
    fetchSubjects();
  }, []); // Fetch data only on the initial mount

  useEffect(() => {
    // Initialize form with classData if provided and if allSubjects is populated
    if (classData && allSubjects.length > 0) {
      const parsedStartDate = dayjs(classData.start_time); // Use Dayjs to parse the date string
      setStartDate(parsedStartDate);
      setStartTime(parsedStartDate);
      setDuration(classData.duration);
      setSelectedStudents(classData.students.map((student) => student.id));

      // Find subject ID by matching subject name
      const subject = allSubjects.find(
        (subject) => subject.name === classData.subject
      );
      if (subject) {
        setSelectedSubject(subject.id); // Set the selected subject ID
      }
    }
  }, [classData, allSubjects.length]); // Fetch data on component mount and reinitialize form when classData changes

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

      if (response.status === 401) {
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Ensure startDate and startTime are valid before submission
    if (!startDate || !startTime) {
      toast.error("Please select a valid date and time.");
      return;
    }

    const parsedDate = new Date(startDate);
    const parsedTime = new Date(startTime);

    if (isNaN(parsedDate.getTime()) || isNaN(parsedTime.getTime())) {
      toast.error("Invalid date or time.");
      return;
    }

    // Combine date and time into a single DateTime object
    const combinedDateTime = new Date(
      parsedDate.getFullYear(),
      parsedDate.getMonth(),
      parsedDate.getDate(),
      parsedTime.getHours(),
      parsedTime.getMinutes()
    );

    const selectedSubjectObj = allSubjects.find(
      (subject) => subject.id === parseInt(selectedSubject)
    );

    const newClass = {
      start_time: combinedDateTime.toISOString(),
      duration: duration,
      students: selectedStudents,
      subject: selectedSubjectObj ? selectedSubjectObj.name : "",
    };

    try {
      const auth = window.sessionStorage.getItem("token");
      const response = await fetch("http://localhost:8000/class/", {
        method: classData ? "PUT" : "POST", // Update if classData exists, else create
        headers: {
          Authorization: `Token ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newClass),
      });

      const data = await response.json();
      console.log(data);
      toast.success("The class event was scheduled");
      handleReloadData();
    } catch (error) {
      console.log("Error: " + error.message);
      toast.error("Failed to schedule class.");
    }
  };

  const studentSelector = () => (
    <FormControl sx={{ width: "100%", maxWidth: "15rem", marginTop: "1rem" }}>
      <InputLabel id="demo-simple-select-label">Students</InputLabel>
      <Select
        id="students"
        multiple
        value={selectedStudents}
        onChange={(e) => setSelectedStudents(e.target.value)}
        required
        className="form-input"
        label="Students"
      >
        {allStudents.map((student) => (
          <MenuItem key={student.id} value={student.id}>
            {student.username}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const subjectSelector = () => (
    <FormControl sx={{ width: "100%", maxWidth: "15rem", marginTop: "1rem" }}>
      <InputLabel id="subject-select-label">Subject</InputLabel>
      <Select
        id="subjects"
        labelId="subject-select-label"
        value={selectedSubject}
        onChange={(e) => setSelectedSubject(e.target.value)}
        required
        className="form-input"
        label="Subject"
      >
        {allSubjects.map((subject) => (
          <MenuItem key={subject.id} value={subject.id}>
            {subject.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const handleDurationChange = (event) => {
    setDuration(event.target.value);
  };

  return (
    <div className="schedule-class-bar-container">
      <div className="schedule-class-bar-form">
        <FormControl sx={{ maxWidth: "15rem", marginTop: "1rem" }}>
          <DatePicker
            value={startDate}
            onChange={(newValue) => setStartDate(newValue)}
            label="Date"
            renderInput={(params) => <TextField {...params} />}
            theme="light"
          />
        </FormControl>

        <FormControl sx={{ width: "15rem", marginTop: "1rem" }}>
          <MobileTimePicker
            value={startTime}
            onChange={(newValue) => setStartTime(newValue)}
            label="Time"
            renderInput={(params) => <TextField {...params} />}
          />
        </FormControl>

        <FormControl
          sx={{
            width: "100%",
            maxWidth: "15rem",
            marginTop: "1rem",
          }}
        >
          <InputLabel htmlFor="duration-input">Duration</InputLabel>
          <Select
            id="duration-select"
            value={duration}
            onChange={handleDurationChange}
            label="Duration"
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

        <button className="schedule-class-button" onClick={handleSubmit}>
          <FaPlus
            className="schedule-class-icon"
            style={{ color: "white", marginRight: "1rem" }}
          />
          Submit
        </button>
      </div>
    </div>
  );
};

export default ScheduleClassBar;
