import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Typography, Box, Container, Modal } from "@mui/material";

import Navigation from "../main_navigation.jsx";
import DashboardHeader from "./dashboard_header.jsx";
import ActionStatisticsBar from "./action_statistics_bar.jsx";

import ClassEventCard from "../ClassEvents/class_event_card.jsx";
import ClassEventWizard from "../ClassEvents/class_event_wizard.jsx";
import ClassEventDetailsDrawer from "../ClassEvents/class_event_details_drawer.jsx";
import ClassEventSearchAndFilter from "../ClassEvents/class_event_search_filter.jsx";

import { useClassEvents } from "../../contexts/class_event_context.jsx";
import { useSubjects } from "../../contexts/subjects_context.jsx";
import { useStudents } from "../../contexts/students_context.jsx";
import { useClassGroups } from "../../contexts/class_groups_context.jsx";

import { cancelClassEvent } from "../../utils/agent.js";

const ClassEventDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const todaysLocalDate = new Date().toLocaleDateString("en-GB");

  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentClassEvent, setCurrentClassEvent] = useState(null);
  const [step, setStep] = useState(1);
  const [filteredClassEvents, setFilteredClassEvents] = useState([]);

  // Consume contexts
  const {
    data: classEventsData,
    refetch: refetchEvents,
    isLoading: eventsLoading,
  } = useClassEvents();
  const { data: subjects } = useSubjects();
  const { data: students } = useStudents();
  const { data: classGroups } = useClassGroups();

  // Transform events by date
  const classEvents = useMemo(() => {
    if (!classEventsData) return {};
    const map = {};
    classEventsData.forEach((event) => {
      const date = new Date(event.start_time).toLocaleDateString("en-GB");
      if (!map[date]) map[date] = [];
      map[date].push(event);
    });
    return map;
  }, [classEventsData]);

  const handleReloadData = () => refetchEvents();

  const handleCancelClassEvent = async () => {
    if (!currentClassEvent) return;
    await cancelClassEvent(currentClassEvent.id);
    handleCloseDetails();
    handleReloadData();
  };

  const handleOpenDetails = (eventData) => {
    setCurrentClassEvent(eventData);
    setDrawerOpen(true);
    navigate(`/dashboard/${eventData.id}`);
  };

  const handleCloseDetails = () => {
    setCurrentClassEvent(null);
    navigate("/dashboard");
    setDrawerOpen(false);
  };

  const handleClose = () => setModalOpen(false);
  const handleOpenStudentSearch = () => setModalOpen(true);

  // Auto-open class if URL has id
  React.useEffect(() => {
    if (!classEventsData || !id) return;
    const classId = parseInt(id, 10);
    const found = classEventsData.find((e) => e.id === classId);
    if (found) {
      setCurrentClassEvent(found);
      setDrawerOpen(true);
    }
  }, [id, classEventsData]);

  if (eventsLoading) return <Typography>Loading class events...</Typography>;

  return (
    <>
      <Navigation />
      <Container>
        <DashboardHeader />
        <ActionStatisticsBar
          page="dashboard"
          actionFunction={setModalOpen}
          actionText="Add New Class"
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
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              maxWidth: "500px",
              width: { xs: "60%", sm: "50%", md: "30%" },
              backgroundColor: "#333",
              padding: 4,
              borderRadius: 2,
              boxShadow: 24,
              color: "white",
              outline: "none",
              maxHeight: "90vh",
              overflowY: "auto",
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
