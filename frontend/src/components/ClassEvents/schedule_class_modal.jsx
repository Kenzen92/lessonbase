import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Box, Modal } from "@mui/material";
import dayjs from "dayjs";
import ClassEventWizard from "./class_event_wizard.jsx";
const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

const ScheduleClassModal = ({
  handleReloadData,
  classData,
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
  const [className, setClassName] = useState("");

  useEffect(() => {
    // Initialize form with classData if provided and if subjects is populated
    if (classData && subjects.length > 0) {
      const parsedStartDate = dayjs(classData.start_time); // Use Dayjs to parse the date string
      setStartDate(parsedStartDate);
      setStartTime(parsedStartDate);
      setDuration(classData.duration);
      setSelectedStudents(classData.students.map((student) => student.id));
      setClassName(classData.name || "");

      // Find subject ID by matching subject name
      const subject = subjects.find(
        (subject) => subject.name === classData.subject
      );
      if (subject) {
        setSelectedSubject(subject.id); // Set the selected subject ID
      }
    }
  }, [classData]); // Fetch data on component mount and reinitialize form when classData changes

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
