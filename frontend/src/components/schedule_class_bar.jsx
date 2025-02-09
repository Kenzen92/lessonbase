import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { renderTimeViewClock } from "@mui/x-date-pickers/timeViewRenderers";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Button,
  Box,
  Grid,
} from "@mui/material";
import dayjs from "dayjs";
import {
  fetchClassEvents,
  fetchStudents,
  fetchSubjects,
} from "../utils/agent.js";

const ScheduleClassBar = ({ handleReloadData, classData }) => {
  const [startDate, setStartDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [allStudents, setAllStudents] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
    fetchSubjects();
  }, []); // Fetch data only on the initial mount

  useEffect(() => {
    const fetchData = async () => {
      const students = await fetchStudents(navigate);
      if (students) setAllStudents(students);

      const subjects = await fetchSubjects(navigate);
      if (subjects) setAllSubjects(subjects);
    };
    fetchData();
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

  const handleCreateClassEvent = async (event) => {
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
      subject: selectedSubjectObj ? selectedSubjectObj.id : null,
    };

    try {
      const auth = window.sessionStorage.getItem("token");
      const response = await fetch("http://localhost:8000/class-event/", {
        method: classData ? "PUT" : "POST", // Update if classData exists, else create
        headers: {
          Authorization: `Token ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newClass),
      });

      const data = await response.json();
      toast.success("The class event was scheduled");
      setStartDate(null);
      setStartTime(null);
      setDuration(null);
      setSelectedStudents([]);
      setSelectedSubject(null);
      handleReloadData();
    } catch (error) {
      console.log("Error: " + error.message);
      toast.error("Failed to schedule class.");
    }
  };

  return (
    <Box
      sx={{
        marginLeft: "auto",
        marginRight: "auto",
        maxWidth: "70rem",
      }}
    >
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          marginLeft: "0.5rem",
          marginRight: "0.5rem",
          boxShadow: 5,
          border: 2,
          borderColor: "#333",
        }}
      >
        <Grid
          container
          spacing={2}
          justifyContent="flex-start"
          alignItems="center"
          direction={{ xs: "column", sm: "row" }}
        >
          <Grid item xs={12} sm={6} lg={4}>
            <DatePicker
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              label="Date"
              fullWidth
              sx={{
                width: "100%", // Ensures DatePicker occupies full width of Grid item
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
              }}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={4}>
            <TimePicker
              value={startTime}
              onChange={(newValue) => setStartTime(newValue)}
              label="Time"
              viewRenderers={{
                hours: renderTimeViewClock,
                minutes: renderTimeViewClock,
                seconds: renderTimeViewClock,
              }}
              fullWidth
              sx={{
                width: "100%", // Ensures DatePicker occupies full width of Grid item
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
              }}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={4} sx={{ minWidth: "10rem" }}>
            <FormControl fullWidth>
              <InputLabel htmlFor="duration-select" sx={{ color: "#fff" }}>
                Duration
              </InputLabel>
              <Select
                id="duration-select"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                label="Duration"
                sx={{
                  color: "#fff", // Selected text color
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#fff", // Default border color
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#fff", // Hover border color
                  },
                  "& .MuiSelect-icon": {
                    color: "#fff", // Caret color
                  },
                }}
              >
                {[0, 15, 30, 45, 60, 75, 90].map((dur) => (
                  <MenuItem key={dur} value={dur}>
                    {dur} minutes
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} lg={4} sx={{ minWidth: "10rem" }}>
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
                  color: "#fff", // Selected text color
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#fff", // Default border color
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#fff", // Hover border color
                  },
                  "& .MuiSelect-icon": {
                    color: "#fff", // Caret color
                  },
                }}
              >
                {allSubjects.map((subject) => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={12} lg={8} sx={{ minWidth: "10rem" }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%",
                gap: "1rem",
              }}
            >
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
                    color: "#fff", // Selected text color
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#fff", // Default border color
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#fff", // Hover border color
                    },
                    "& .MuiSelect-icon": {
                      color: "#fff", // Caret color
                    },
                  }}
                >
                  {allStudents.map((student) => (
                    <MenuItem key={student.id} value={student.id}>
                      {student.username}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateClassEvent}
              >
                Submit
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default ScheduleClassBar;
