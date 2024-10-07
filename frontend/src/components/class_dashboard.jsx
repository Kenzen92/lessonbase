import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ClassEventCard from "./class_event_card";
import TeacherStatistics from "./../components/teacher_statistics.jsx";
import handleUnautherizedRequest from "./unautherized_request";
import ScheduleClassBar from "./schedule_class_bar.jsx";
import { Typography, Box, Button } from "@mui/material";

const ClassDashboard = () => {
  const [classEvents, setClassEvents] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [error, setError] = useState(null);
  const [previous, setPrevious] = useState(false);
  const navigate = useNavigate();

  // Define fetchClassEvents function
  const fetchClassEvents = async () => {
    try {
      const auth = window.sessionStorage.getItem("token");
      const response = await fetch("http://localhost:8000/class/", {
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
        throw new Error("Failed to fetch class events");
      }

      const data = await response.json();
      console.log(data);
      let dateClassMap = {};

      // Loop through each event in the data array
      data.forEach((event) => {
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
    } catch (error) {
      setError(error.message);
    }
  };

  const fetchStatistics = async () => {
    try {
      const auth = window.sessionStorage.getItem("token");
      const response = await fetch("http://localhost:8000/teacher-statistics", {
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
        throw new Error("Failed to fetch class events");
      }

      const data = await response.json();
      setStatistics(data.data);
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchClassEvents();
    fetchStatistics();
  }, []);

  // Callback function to force re-render of ClassDashboard after item deletion
  const handleReloadData = () => {
    console.log("Handling");
    // Call fetchClassEvents to fetch updated data
    fetchClassEvents();
    fetchStatistics();
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
    <Box
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        "&::-webkit-scrollbar": {
          display: "none",
        },
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
      }}
    >
      <Box sx={{ mb: 4 }}>
        <TeacherStatistics statistics={statistics} />
      </Box>

      <Box sx={{ mb: 4 }}>
        <ScheduleClassBar handleReloadData={handleReloadData} />
      </Box>

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
          gap: "16px",
        }}
      >
        {Object.keys(filteredClassEvents).map((date) => (
          <Box key={date} sx={{ display: "flex", flexDirection: "column" }}>
            <Typography sx={{ marginLeft: "2rem" }}>{date}</Typography>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              {filteredClassEvents[date].map((classEvent, index) => (
                <ClassEventCard
                  key={index}
                  eventData={classEvent}
                  handleReloadData={handleReloadData}
                />
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default ClassDashboard;
