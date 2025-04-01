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
import ClassEventSearchAndFilter from "../ClassEvents/class_event_search_filter.jsx";

const ClassDashboard = (classId) => {
  const [classEvents, setClassEvents] = useState([]);
  const [filteredClassEvents, setFilteredClassEvents] = useState([]);
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
      const classEventsJSON = JSON.parse(classEventsData);

      setClassEvents(classEventsJSON);
      setFilteredClassEvents(classEventsJSON);
      setStatistics((await fetchStatistics()).data);
      setStudents(await fetchStudents());
      setSubjects(await fetchSubjects());
      setClassGroups(await fetchClassGroups());
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const classEventCards = (classEventsData) => {
    return Object.entries(classEventsData).map(([date, events]) => (
      <Box key={date} sx={{ width: "100%", mb: 3 }}>
        <Typography variant="h6" sx={{ textAlign: "center", mb: 2 }}>
          {new Date(date).toLocaleDateString()}{" "}
          {/* Convert timestamp to readable format */}
        </Typography>
        {events.map((event) => (
          <ClassEventCard
            key={event.id}
            eventData={event}
            handleReloadData={handleReloadData}
            handleOpenDetails={handleOpenDetails}
          />
        ))}
      </Box>
    ));
  };

  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  return (
    <Container>
      <ClassEventDetailsDrawer
        open={drawerOpen}
        onClose={handleCloseDetails}
        currentClassEvent={currentClassEvent}
        handleReloadData={handleReloadData}
        handleCancelClassEvent={handleCancelClassEvent}
      />
      <Box sx={{ mt: 2 }}>
        <TeacherStatistics statistics={statistics} />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "row" }}>
        <PrimaryButton
          onClick={() => setModalOpen(true)}
          sx={{ minWidth: 150 }}
        >
          Add New Class
        </PrimaryButton>
        <ClassEventSearchAndFilter
          allClassEvents={classEvents}
          setFilteredClassEvents={setFilteredClassEvents}
        />
      </Box>
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
        {classEventCards(filteredClassEvents)}
      </Box>
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
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
          <ClassEventWizard
            handleReloadData={handleReloadData}
            classData={currentClassEvent}
            modalOpen={modalOpen}
            handleClose={() => setModalOpen(false)}
            setModalOpen={setModalOpen}
            subjects={subjects}
            students={students}
            step={step}
            setStep={setStep}
            classGroups={classGroups}
          />
        </Box>
      </Modal>
    </Container>
  );
};

export default ClassDashboard;
