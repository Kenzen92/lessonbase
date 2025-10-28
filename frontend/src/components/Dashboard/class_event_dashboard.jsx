import React, { useState, useEffect } from "react";
import ClassEventCard from "../ClassEvents/class_event_card.jsx";
import { Typography, Box, Container, Modal, Alert } from "@mui/material";
import {
  fetchClassEvents,
  fetchSubjects,
  fetchStudents,
  fetchClassGroups,
  cancelClassEvent,
  fetchProfileData,
} from "../../utils/agent.js";
import ClassEventWizard from "../ClassEvents/class_event_wizard.jsx";
import ClassEventDetailsDrawer from "../ClassEvents/class_event_details_drawer.jsx";
import ClassEventSearchAndFilter from "../ClassEvents/class_event_search_filter.jsx";
import ActionStatisticsBar from "./action_statistics_bar.jsx";
import Navigation from "../main_navigation.jsx";
import { useAuth } from "../../contexts/auth_context.jsx";
import { useParams } from "react-router-dom"; // <-- import useParams
import { useNavigate } from "react-router-dom";
import DashboardHeader from "./dashboard_header.jsx";

const ClassEventDashboard = () => {
  const [classEvents, setClassEvents] = useState([]);
  const [filteredClassEvents, setFilteredClassEvents] = useState([]);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentClassEvent, setCurrentClassEvent] = useState(null);
  const [subjects, setSubjects] = useState(null);
  const [students, setStudents] = useState(null);
  const [step, setStep] = useState(1);
  const [classGroups, setClassGroups] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const { auth } = useAuth();
  const { id } = useParams(); // <-- get the id from the URL
  const navigate = useNavigate();
  const todaysLocalDate = new Date().toLocaleDateString("en-GB");

  const fetchData = async () => {
    try {
      const classEventsData = await fetchClassEvents();
      let dateClassMap = {};

      // Loop through each event in the data array
      classEventsData.forEach((event) => {
        // Extract the date from the start_time of the event
        const eventDate = new Date(event.start_time);
        const formattedDate = eventDate.toLocaleDateString("en-GB"); // Format: DD/MM/YYYY with consistent formatting

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

      // check if the current class event was updated and reset it
      if (currentClassEvent) {
        const currentEventIndex = classEventsData.findIndex(
          (event) => event.id === currentClassEvent.id
        );
        const updatedCurrentEvent = classEventsData[currentEventIndex];
        setCurrentClassEvent(updatedCurrentEvent);
      }
      if (id != undefined) {
        const classId = parseInt(id, 10);
        const classIdIndex = classEventsData.findIndex(
          (event) => event.id === classId
        );
        setCurrentClassEvent(classEventsData[classIdIndex]);
        navigate(`/dashboard/${classId}`); // Push to new URL
        setDrawerOpen(true);
      }

      const fetchedStudents = await fetchStudents();
      setStudents(fetchedStudents);
      const fetchedSubjects = await fetchSubjects();
      setSubjects(fetchedSubjects);
      const fetchedClassGroups = await fetchClassGroups();
      setClassGroups(fetchedClassGroups);
      const fetchedProfileData = await fetchProfileData();
      setProfileData(fetchedProfileData);
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Callback function to force re-render of ClassEventDashboard after item deletion
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
    navigate(`/dashboard/${eventData.id}`); // Push to new URL
  };

  const handleCloseDetails = () => {
    setCurrentClassEvent(null);
    navigate("/dashboard");
    setDrawerOpen(false);
  };

  const handleOpenStudentSearch = () => {
    setModalOpen(true);
  };

  // Utility function to handle the 'previous' state

  const handleClose = () => {
    setModalOpen(false);
  };

  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  return (
    <>
      <Navigation />
      <Container>
        <DashboardHeader profileData={profileData} />
        <ActionStatisticsBar
          page={"dashboard"}
          actionFunction={setModalOpen}
          actionText={"Add New Class"}
        />
        <ClassEventDetailsDrawer
          open={drawerOpen}
          onClose={handleCloseDetails}
          currentClassEvent={currentClassEvent}
          handleReloadData={handleReloadData}
          handleOpenStudentSearch={handleOpenStudentSearch}
          handleCancelClassEvent={handleCancelClassEvent}
        />

        <ClassEventSearchAndFilter
          allClassEvents={classEvents}
          setFilteredClassEvents={setFilteredClassEvents}
          allClassGroups={classGroups}
        />

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
          }}
        >
          {Object.keys(filteredClassEvents)
            .sort((a, b) => {
              const [aDay, aMonth, aYear] = a.split("/").map(Number);
              const [bDay, bMonth, bYear] = b.split("/").map(Number);
              return (
                new Date(aYear, aMonth - 1, aDay) -
                new Date(bYear, bMonth - 1, bDay)
              );
            })
            .map((date) => (
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
                    {date === todaysLocalDate ? "Today" : date}
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
              position: "absolute", // Crucial for positioning
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)", // Centers the box

              // Define the width of your modal content here
              // Option 1: Max width, responsive up to a point (common)
              maxWidth: "500px",
              width: { xs: "60%", sm: "50%", md: "30%" },
              backgroundColor: "#333",
              padding: 4,
              borderRadius: 2,
              boxShadow: 24,
              color: "white",
              outline: "none", // Remove focus outline
              maxHeight: "90vh", // Prevent modal from getting too tall
              overflowY: "auto", // Add scroll if content exceeds maxHeight
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
      </Container>
    </>
  );
};

export default ClassEventDashboard;
