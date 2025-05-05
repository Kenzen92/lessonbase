import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import ClassEventCard from "../ClassEvents/class_event_card";
import {
  Modal,
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
} from "@mui/material";
import { FaInfoCircle } from "react-icons/fa";
import ClassGroupChip from "../ClassGroups/class_group_chip";

const StudentInfoCard = ({ student, handleOpenDrawer, setCurrentStudent }) => {
  return (
    <Box
      sx={{
        p: 2, // Reduced padding for a more compact look
        boxShadow: 3,
        borderRadius: 2,
        maxWidth: "40rem",
        minHeight: "5rem", // Reduced minHeight for a bar style
        boxShadow: 5,
        border: 2,
        borderColor: "#333",
        display: "flex",
        alignItems: "center", // Align items vertically in the bar
        justifyContent: "space-between", // Distribute space between left and right sections
        backgroundColor: "#292929",
        transition: "background-color 0.3s ease",
        "&:hover": {
          backgroundColor: "#333",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", minWidth: 150 }}>
        <Avatar
          alt={student.first_name}
          src={student.profile_picture}
          sx={{ width: 40, height: 40, mr: 1 }} // Reduced avatar size and margin
        >
          {student.first_name ? student.first_name[0] : null}
        </Avatar>
        <Typography variant="subtitle1">{`${student.first_name} ${student.last_name}`}</Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
        {student.class_groups.map((group) => {
          return <ClassGroupChip key={group.id} classGroup={group} />; // <-- Added 'return'
        })}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center" }}>
        <IconButton
          variant="contained"
          color="primary"
          onClick={() => {
            setCurrentStudent(student);
            handleOpenDrawer(true);
          }}
          sx={{ ml: 1, fontSize: "0.8rem" }} // Reduced IconButton size
        >
          <FaInfoCircle color="white" size={20} />
        </IconButton>
      </Box>
    </Box>
  );
};

export default StudentInfoCard;
