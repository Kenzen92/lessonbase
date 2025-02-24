import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { renderTimeViewClock } from "@mui/x-date-pickers/timeViewRenderers";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Box,
  Grid,
  Modal,
} from "@mui/material";
import dayjs from "dayjs";
import { fetchStudents, fetchSubjects } from "../utils/agent.js";
import ClassEventWizard from "./class_event_wizard.jsx";

const ScheduleClassModal = ({
  handleReloadData,
  classData,
  modalOpen,
  handleClose,
  students,
  subjects,
  classGroups,
  step,
  setStep,
}) => {
  const [startDate, setStartDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");

  useEffect(() => {
    // Initialize form with classData if provided and if subjects is populated
    if (classData && subjects.length > 0) {
      const parsedStartDate = dayjs(classData.start_time); // Use Dayjs to parse the date string
      setStartDate(parsedStartDate);
      setStartTime(parsedStartDate);
      setDuration(classData.duration);
      setSelectedStudents(classData.students.map((student) => student.id));

      // Find subject ID by matching subject name
      const subject = subjects.find(
        (subject) => subject.name === classData.subject
      );
      if (subject) {
        setSelectedSubject(subject.id); // Set the selected subject ID
      }
    }
  }, [classData]); // Fetch data on component mount and reinitialize form when classData changes

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

    const selectedSubjectObj = subjects.find(
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
    <Modal>
      <Box
        sx={{
          backgroundColor: "#333",
          padding: 4,
          borderRadius: 2,
          boxShadow: 24,
          width: { xs: "90%", sm: "70%", md: "50%", lg: "30%" },
          color: "white",
        }}
      >
        <ClassEventWizard
          step={step}
          setStep={setStep}
          students={students}
          subjects={subjects}
          classGroups={classGroups}
          handleClose={handleClose}
        />
      </Box>
    </Modal>
  );
};

export default ScheduleClassModal;
