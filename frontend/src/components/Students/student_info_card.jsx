import React, { useState } from "react";
import Avatar from "@mui/material/Avatar";
import {
  Box,
  Typography,
  IconButton,
  Button, // Added Button component
} from "@mui/material";
import { FaInfoCircle } from "react-icons/fa";
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'; // Icon for chat button
import ClassGroupChip from "../ClassGroups/class_group_chip";

const StudentInfoCard = ({ student, setDrawerOpen, setCurrentStudent, handleOpenChat }) => {

  return (
    <Box
      sx={{
        p: 1.5, // Further reduced padding for a thinner look
        boxShadow: 3,
        borderRadius: 2,
        width: "100%", // Takes up full available width
        minHeight: "4.5rem", // Slightly reduced minHeight for a bar style
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
        mb: 2, // Add some margin-bottom for spacing between cards
      }}
      onClick={() => {
        setCurrentStudent(student);
        setDrawerOpen(true);
      }}
    >
      {/* Student Name and Avatar */}
      <Box sx={{ display: "flex", alignItems: "center", minWidth: "150px" }}>
        <Avatar
          alt={student.first_name}
          src={student.profile_picture}
          sx={{ width: 36, height: 36, mr: 1.5 }} // Adjusted avatar size and margin
        >
          {student.first_name ? student.first_name[0] : null}
        </Avatar>
        <Typography variant="subtitle1" sx={{ color: "white", flexShrink: 0 }}>{`${student.first_name} ${student.last_name}`}</Typography>
      </Box>

      {/* Class Group Chips */}
      <Box sx={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 1, mx: 2, justifyContent: 'center' }}>
        {student.class_groups.map((group) => (
          <ClassGroupChip key={group.id} classGroup={group} />
        ))}
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {/* Chat Button */}
        <Button
          variant="contained"
          size="small" // Make the button smaller
          startIcon={<ChatBubbleOutlineIcon sx={{ color: 'white' }} />}
          onClick={() => {
            setCurrentStudent(student);
            // Assuming handleOpenChat is a function passed as a prop
            if (handleOpenChat) {
              handleOpenChat(student);
            }
          }}
          sx={{
            minWidth: 'auto',
            py: 0.8,
            px: 1.5,
            fontSize: "0.75rem",
            backgroundColor: 'primary.main', // You can explicitly set button background if needed
            color: 'white', // Set button text and icon color to white
            '& .MuiButton-startIcon': {
              marginRight: 0.5,
              color: 'white', // **Explicitly set icon color to white**
            },
            '&:hover': {
              backgroundColor: 'primary.dark', // Adjust hover background if needed
            },
          }}
        >
          Chat
        </Button>

        {/* Info Drawer Button */}
        <IconButton
          aria-label="more info"
          onClick={() => {
            setCurrentStudent(student);
            setDrawerOpen(true);
          }}
          sx={{ color: "white", p: 0.8 }} // Adjusted padding for the icon button
        >
          <FaInfoCircle size={20} style={{ color: 'white' }} />

        </IconButton>
      </Box>
    </Box>
  );
};

export default StudentInfoCard;