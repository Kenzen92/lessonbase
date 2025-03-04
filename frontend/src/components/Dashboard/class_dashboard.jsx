import React, { useState, useEffect } from "react";
import ClassEventCard from "../ClassEvents/class_event_card.jsx";
import TeacherStatistics from "./teacher_statistics.jsx";
import { Typography, Box, Container, Modal, Alert } from "@mui/material";
import {
  fetchStatistics,
  fetchClassEvents,
  fetchSubjects,
  fetchStudents,
  fetchClassGroups,
  cancelClassEvent,
} from "../../utils/agent.js";
import ClassEventWizard from "../ClassEvents/class_event_wizard.jsx";
import ClassEventDetailsDrawer from "../ClassEvents/class_event_details_drawer.jsx";
import { PrimaryButton, SecondaryButton } from "../../styles/buttons.jsx";

const ClassDashboard = (classId) => {
  const [classEvents, setClassEvents] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [error, setError] = useState(false);
  const [previous, setPrevious] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
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
      // check if the current class event was updated and reset it
      if (currentClassEvent) {
        const currentEventIndex = classEventsData.findIndex(
          (event) => event.id === currentClassEvent.id
        );
        const updatedCurrentEvent = classEventsData[currentEventIndex];
        setCurrentClassEvent(updatedCurrentEvent);
      }
      console.log(classId.classId);
      if (classId.classId != undefined) {
        const id = parseInt(classId.classId, 10);
        console.log(id);
        const classIdIndex = classEventsData.findIndex(
          (event) => event.id === id
        );
        setCurrentClassEvent(classEventsData[classIdIndex]);
        setDrawerOpen(true);
      }

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

  const handleCancelClassEvent = () => {
    cancelClassEvent(currentClassEvent.id);
    handleCloseDetails();
    handleReloadData();
  };

  const handleOpenDetails = (eventData) => {
    setCurrentClassEvent(eventData);
    setDrawerOpen(true);
  };

  const handleCloseDetails = () => {
    setCurrentClassEvent(null);
    setDrawerOpen(false);
  };

  const handleOpenStudentSearch = () => {
    console.log("searching");
    setModalOpen(true);
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
        <ClassEventDetailsDrawer
          open={drawerOpen}
          onClose={handleCloseDetails}
          currentClassEvent={currentClassEvent}
          handleReloadData={handleReloadData}
          handleOpenStudentSearch={handleOpenStudentSearch}
          handleCancelClassEvent={handleCancelClassEvent}
        />
        <Box sx={{ mb: 4 }}>
          <TeacherStatistics statistics={statistics} />
        </Box>
        <PrimaryButton onClick={() => setModalOpen(true)}>
          Add New Class
        </PrimaryButton>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: "1rem",
            mb: 4,
          }}
        >
          {!previous ? (
            <PrimaryButton onClick={() => setPrevious(true)}>
              Previous
            </PrimaryButton>
          ) : (
            <SecondaryButton onClick={() => setPrevious(true)}>
              Previous
            </SecondaryButton>
          )}

          {previous ? (
            <PrimaryButton onClick={() => setPrevious(false)}>
              Upcoming
            </PrimaryButton>
          ) : (
            <SecondaryButton onClick={() => setPrevious(false)}>
              Upcoming
            </SecondaryButton>
          )}
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
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  padding: "2rem",
                  marginBottom: "1rem",
                }}
              >
                <Typography sx={{ marginLeft: "1rem" }} variant="h6">
                  {date}
                </Typography>
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
