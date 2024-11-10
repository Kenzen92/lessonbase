import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import dayjs from "dayjs";

const ScheduleClassModal = ({ handleReloadData }) => {
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

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    fetchStudents();
    fetchSubjects();
  }, []);

  const getNext15MinuteBlock = () => {
    const now = dayjs();
    const minutes = now.minute();
    const nextBlock = Math.ceil(minutes / 15) * 15;
    return now.set("minute", nextBlock).set("second", 0).set("millisecond", 0);
  };

  const handleDateChange = (newValue) => {
    setStartDate(newValue);
    if (dayjs(newValue).isSame(dayjs(), "day")) {
      const nextBlock = getNext15MinuteBlock();
      setStartTime(nextBlock);
    } else {
      setStartTime(null);
    }
  };

  const handleTimeChange = (newValue) => {
    setStartTime(newValue);
  };

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

    const parsedDate = dayjs(startDate).toDate();
    const parsedTime = dayjs(startTime).toDate();

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
        method: "POST",
        headers: {
          Authorization: `Token ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newClass),
      });

      const data = await response.json();
      toast.success("The class event was scheduled");
      handleReloadData();
      handleClose();
    } catch (error) {
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
    <Box
      sx={{
        mt: 2,
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      <Button variant="contained" onClick={() => handleOpen()}>
        Schedule Next Class
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        className="schedule-class-overlay"
      >
        <Box className="modal">
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
              Schedule Next Class
            </Typography>
            <Button onClick={handleClose}>Close</Button>
          </Box>
          <Box className="schedule-modal-form">
            <FormControl sx={{ maxWidth: "15rem", marginTop: "1rem" }}>
              <DatePicker
                value={startDate}
                onChange={handleDateChange}
                label="Date"
                renderInput={(params) => <TextField {...params} />}
                minDate={dayjs()} // Prevent past date selection
              />
            </FormControl>

            <FormControl sx={{ width: "15rem", marginTop: "1rem" }}>
              <MobileTimePicker
                value={startTime}
                onChange={handleTimeChange}
                label="Time"
                renderInput={(params) => <TextField {...params} />}
                minutesStep={15} // Restrict to 15-minute increments
                minTime={
                  startDate && dayjs(startDate).isSame(dayjs(), "day")
                    ? getNext15MinuteBlock()
                    : null
                } // Restrict time if today
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

            <Button
              sx={{ marginTop: "1rem" }}
              className="schedule-submit-button"
              variant="contained"
              color="primary"
              onClick={handleSubmit}
            >
              Submit
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default ScheduleClassModal;
