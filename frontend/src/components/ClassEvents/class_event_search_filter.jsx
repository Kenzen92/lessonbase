import React, { useState, useEffect } from "react";
import { Box, TextField, Typography } from "@mui/material";
import inputStyle from "../../styles/input";
import { PrimaryButton, SecondaryButton } from "../../styles/buttons.jsx";
import { useAuth } from "../../contexts/auth_context.jsx";

function ClassEventSearchAndFilter({
  allClassEvents,
  setFilteredClassEvents,
  allClassGroups,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [previous, setPrevious] = useState(false);
  const [classGroupFilter, setClassGroupFilter] = useState({});
  const { auth } = useAuth();
  useEffect(() => {
    // Utility function to check if a date is in the past
    const isPast = (date) => {
      const eventDate = new Date(date);
      const now = new Date();
      return eventDate < now;
    };
    // Filter class events based on the 'previous' state
    const timeFilteredClassEvents = Object.keys(allClassEvents).reduce(
      (result, date) => {
        const filteredEvents = allClassEvents[date].filter((event) => {
          const isEventPast = isPast(event.start_time);
          const lowerCaseSearch = searchTerm.toLowerCase();
          if ((previous && !isEventPast) || (!previous && isEventPast)) {
            return false;
          }

          return (
            (auth.userType === "teacher" &&
              event.students.some((student) =>
                [
                  `${student.first_name.toLowerCase()} ${student.last_name.toLowerCase()}`,
                  student.first_name.toLowerCase(),
                  student.last_name.toLowerCase(),
                  student.username?.toLowerCase(),
                ].some((field) => field.includes(lowerCaseSearch))
              )) ||
            (event.subject?.name.toLowerCase().includes(lowerCaseSearch) ??
              false)
          );
        });

        if (filteredEvents.length > 0) {
          result[date] = filteredEvents;
        }
        return result; // Ensure reduce returns the accumulated result
      },
      {}
    );
    console.log(timeFilteredClassEvents);
    // Filter class events based on the selected class group
    setFilteredClassEvents(timeFilteredClassEvents);
  }, [searchTerm, previous, allClassEvents, classGroupFilter]);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: 2,
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <TextField
          sx={{ ...inputStyle, maxWidth: 350, marginLeft: "auto" }}
          label={
            auth.userType === "teacher"
              ? "Search student, or subject"
              : "Search subject"
          }
          variant="outlined"
          fullWidth
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
    </Box>
  );
}

export default ClassEventSearchAndFilter;
