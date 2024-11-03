import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { MobileTimePicker } from "@mui/x-date-pickers/MobileTimePicker";
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
        maxWidth: "80rem",
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
        {/* Title and Button Container */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography variant="h4" sx={{ color: "#fff" }}>
            Schedule Your Next Class
          </Typography>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Submit
          </Button>
        </Box>
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
              sx={{
                minWidth: "10rem",
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "#fff", // Default border color
                  },
                  "&:hover fieldset": {
                    borderColor: "#fff", // Hover border color
                  },
                },
              }}
              slots={{
                textField: (params) => (
                  <TextField
                    {...params}
                    fullWidth
                    InputLabelProps={{
                      style: { color: "#fff" }, // Label color
                    }}
                    InputProps={{
                      style: { color: "#fff" }, // Text color
                    }}
                  />
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={4}>
            <MobileTimePicker
              value={startTime}
              onChange={(newValue) => setStartTime(newValue)}
              label="Time"
              sx={{
                minWidth: "10rem",
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "#fff", // Default border color
                  },
                  "&:hover fieldset": {
                    borderColor: "#fff", // Hover border color
                  },
                },
              }}
              slots={{
                textField: (params) => (
                  <TextField
                    {...params}
                    fullWidth
                    InputLabelProps={{
                      style: { color: "#fff" }, // Label color
                    }}
                    InputProps={{
                      style: { color: "#fff" }, // Text color
                    }}
                  />
                ),
              }}
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
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: "#333", // Background color of the dropdown menu
                      color: "#fff", // Text color in the dropdown menu
                    },
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
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: "#333", // Background color of the dropdown menu
                      color: "#fff", // Text color in the dropdown menu
                    },
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
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: "#333", // Background color of the dropdown menu
                      color: "#fff", // Text color in the dropdown menu
                    },
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
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default ScheduleClassBar;
