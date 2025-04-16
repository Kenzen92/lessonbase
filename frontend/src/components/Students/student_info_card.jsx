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

const StudentInfoCard = ({
  student,
  handleOpenDrawer,
  setCurrentStudent,
}) => {
  const [error, setError] = useState(null);
  const navigate = useNavigate();



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
      }}
    >
      {/* Left Column: Avatar and Name */}
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Avatar
          alt={student.first_name}
          src={student.profile_picture}
          sx={{ width: 40, height: 40, mr: 1 }} // Reduced avatar size and margin
        >
          {student.first_name ? student.first_name[0] : null}
        </Avatar>
        <Typography variant="subtitle1">{`${student.first_name} ${student.last_name}`}</Typography>
      </Box>

      {/* Right Row: Action Buttons */}
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
