import React, { useState, useEffect } from "react";
import ClassEventCard from "./class_event_card";
import TeacherStatistics from "./../components/teacher_statistics.jsx";
import { Typography, Box, Button, Container, Modal } from "@mui/material";
import {
  fetchStatistics,
  fetchClassEvents,
  fetchSubjects,
  fetchStudents,
  fetchClassGroups,
} from "../utils/agent.js";
import ClassEventWizard from "./class_event_wizard.jsx";

const ClassDashboard = () => {
  const [classEvents, setClassEvents] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [error, setError] = useState(false);
  const [previous, setPrevious] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentClassEvent, setCurrentClassEvent] = useState(null);
  const [subjects, setSubjects] = useState(null);
  const [students, setStudents] = useState(null);
  const [step, setStep] = useState(1);
  const [classGroups, setClassGroups] = useState(null);
  const fetchData = async () => {
    try {
      const classEventsData = await fetchClassEvents();
      let dateClassMap = {};

      // Loop through each event in the data array
      classEventsData.forEach((event) => {
        // Extract the date from the start_time of the event
        const eventDate = new Date(event.start_time);
        const formattedDate = `${eventDate.getDate()}/${
          eventDate.getMonth() + 1
        }/${eventDate.getFullYear()}`; // Format: DD/MM/YYYY

        // Check if the date exists as a key in the dateClassMap
        if (dateClassMap[formattedDate]) {
          // If the date exists, add this class event to the value array
          dateClassMap[formattedDate].push(event);
        } else {
          // If the date doesn't exist, create the value array and add this class event
          dateClassMap[formattedDate] = [event];
        }
      });
      setClassEvents(dateClassMap);
      const statistics = await fetchStatistics();
      setStatistics(statistics.data);
      const fetchedStudents = await fetchStudents();
      setStudents(fetchedStudents);
      const fetchedSubjects = await fetchSubjects();
      setSubjects(fetchedSubjects);
      const fetchedClassGroups = await fetchClassGroups();
      setClassGroups(fetchedClassGroups);
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Callback function to force re-render of ClassDashboard after item deletion
  const handleReloadData = () => {
    fetchData();
  };

  const handleOpenDetails = (eventId) => {
    console.log("opening", eventId);
  };

  // Utility function to handle the 'previous' state

  const handleClose = () => {
    console.log("closing");
    setModalOpen(false);
  };

  // Utility function to check if a date is in the past
  const isPast = (date) => {
    const eventDate = new Date(date);
    const now = new Date();
    return eventDate < now;
  };

  // Filter class events based on the 'previous' state
  const filteredClassEvents = Object.keys(classEvents).reduce(
    (result, date) => {
      const filteredEvents = classEvents[date].filter((event) => {
        const isEventPast = isPast(event.start_time);
        return previous ? isEventPast : !isEventPast;
      });
      if (filteredEvents.length > 0) {
        result[date] = filteredEvents;
      }
      return result;
    },
    {}
  );

  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  return (
    <>
      <Container>
        <Box sx={{ mb: 4 }}>
          <TeacherStatistics statistics={statistics} />
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={() => setModalOpen(true)}
          sx={{ mb: 4 }}
        >
          Add New Class
        </Button>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: "1rem",
            mb: 4,
          }}
        >
          <Button
            variant={previous ? "contained" : "outlined"}
            onClick={() => setPrevious(true)}
            sx={{ width: "15%" }}
          >
            Previous
          </Button>
          <Button
            variant={!previous ? "contained" : "outlined"}
            onClick={() => setPrevious(false)}
            sx={{ width: "15%" }}
          >
            Upcoming
          </Button>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
          }}
        >
          {Object.keys(filteredClassEvents).map((date) => (
            <Box
              key={date}
              sx={{
                display: "flex",
                flexDirection: "column",
                width: { sm: "95%", md: "90%", lg: "80%", xl: "70%" },
              }}
            >
              <Typography sx={{ marginLeft: "2rem" }}>{date}</Typography>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                }}
              >
                {filteredClassEvents[date].map((classEvent, index) => (
                  <ClassEventCard
                    key={index}
                    eventData={classEvent}
                    handleReloadData={handleReloadData}
                    handleOpenDetails={handleOpenDetails}
                  />
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
      <Modal
        open={modalOpen}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
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
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ClassEventWizard
            handleReloadData={handleReloadData}
            classData={currentClassEvent}
            modalOpen={modalOpen}
            handleClose={handleClose}
            setModalOpen={setModalOpen}
            subjects={subjects}
            students={students}
            step={step}
            setStep={setStep}
            classGroups={classGroups}
          />
        </Box>
      </Modal>
    </>
  );
};

export default ClassDashboard;
