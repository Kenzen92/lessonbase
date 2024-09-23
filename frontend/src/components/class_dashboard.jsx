import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ClassEventCard from "./class_event_card";
import ScheduleClassModal from "./schedule_class_bar.jsx";
import TeacherStatistics from "./../components/teacher_statistics.jsx";
import "../styles/class_dashboard.css";

import handleUnautherizedRequest from "./unautherized_request";
import ScheduleClassBar from "./schedule_class_bar.jsx";
import { Typography } from "@mui/material";

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
    return <div>Error: {error}</div>;
  }

  return (
    <div className="main-content">
      <div className="statistics-section">
        <TeacherStatistics statistics={statistics} />
      </div>

      <div className="schedule-class-modal">
        <ScheduleClassBar handleReloadData={handleReloadData} />
      </div>

      <div className="previous-future-toggle-buttons">
        <button
          className={previous ? "toggle-button toggle-active" : "toggle-button"}
          onClick={() => setPrevious(true)}
        >
          Previous
        </button>
        <button
          className={
            !previous ? "toggle-button toggle-active" : "toggle-button"
          }
          onClick={() => setPrevious(false)}
        >
          Upcoming
        </button>
      </div>

      <div
        className={`cards-section ${
          previous ? "previous-cards-section" : "future-cards-section"
        }`}
      >
        {Object.keys(filteredClassEvents).map((date) => (
          <div key={date}>
            <Typography>{date}</Typography>
            {filteredClassEvents[date].map((classEvent, index) => (
              <ClassEventCard
                key={index}
                eventData={classEvent}
                handleReloadData={handleReloadData}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassDashboard;
