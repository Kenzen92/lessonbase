import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Typography, Box, Container, Modal, Paper } from "@mui/material";

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
import { FaSpinner } from "react-icons/fa";

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

        {eventsLoading ? (
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <FaSpinner color="#00b0ff" />
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
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
              .map((date) => {
                const isToday = date === todaysLocalDate;
                return (
                  <Box
                    key={date}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      width: "100%",
                      mb: "1.5rem",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                      }}
                    >
                      {/* TODAY SECTION */}
                      {isToday ? (
                        <Paper
                          elevation={6}
                          sx={{
                            position: "relative",
                            p: "1.5rem",
                            mb: "1.5rem",
                            borderRadius: "1rem",
                            background:
                              "linear-gradient(145deg, rgba(20,20,20,0.85), rgba(35,35,35,0.95))",
                            border: "1px solid rgba(0,150,255,0.4)",
                            backdropFilter: "blur(10px)",
                            boxShadow:
                              "0 0 20px rgba(0,150,255,0.15), 0 0 10px rgba(0,150,255,0.05)",
                            transition: "transform 0.2s ease-in-out",
                            "&:hover": {
                              transform: "translateY(-3px)",
                              boxShadow:
                                "0 0 25px rgba(0,150,255,0.25), 0 0 15px rgba(0,150,255,0.1)",
                            },
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              color: "#00b0ff",
                              fontWeight: 600,
                              mb: "1rem",
                            }}
                          >
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                backgroundColor: "#00b0ff",
                                animation: "pulse 2s infinite ease-in-out",
                                "@keyframes pulse": {
                                  "0%, 100%": {
                                    opacity: 0.6,
                                    transform: "scale(0.9)",
                                  },
                                  "50%": {
                                    opacity: 1,
                                    transform: "scale(1.3)",
                                  },
                                },
                              }}
                            />
                            Today
                          </Typography>

                          {filteredClassEvents[date].map(
                            (classEvent, index) => (
                              <ClassEventCard
                                key={index}
                                eventData={classEvent}
                                handleReloadData={handleReloadData}
                                handleOpenDetails={handleOpenDetails}
                              />
                            )
                          )}
                        </Paper>
                      ) : (
                        // OTHER DATES
                        <Box sx={{ mb: "1rem" }}>
                          <Typography
                            variant="h6"
                            sx={{
                              color: "rgba(255,255,255,0.8)",
                              ml: "1rem",
                              mb: "0.5rem",
                            }}
                          >
                            {date}
                          </Typography>
                          {filteredClassEvents[date].map(
                            (classEvent, index) => (
                              <ClassEventCard
                                key={index}
                                eventData={classEvent}
                                handleReloadData={handleReloadData}
                                handleOpenDetails={handleOpenDetails}
                              />
                            )
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                );
              })}
          </Box>
        )}

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
              maxWidth: "1200px",
              width: { xs: "90%", sm: "85%", md: "80%", lg: "75%" },
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
