import React, { useState } from "react";
import {
  Box,
  Typography,
  ListItem,
  Button,
  Avatar,
  IconButton,
} from "@mui/material";
import inputStyle from "../../styles/input";
import { useNavigate } from "react-router-dom";
import { FaInfoCircle } from "react-icons/fa";

const StudentListCard = ({ student, removeStudent, action }) => {
  const navigate = useNavigate();

  const handleNavigateStudentDetails = () => {
    navigate(`/students/${student.id}`);
  };

  return (
    <ListItem
      alignItems="flex-start"
      sx={{ px: 0, justifyContent: "space-between" }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Avatar alt={student.first_name} src={student.avatar} />
        <Typography sx={{ ...inputStyle }}>
          {student.first_name} {student.last_name}
        </Typography>
      </Box>
      <Box>
        {action == "navigate" ? (
          <IconButton
            variant="contained"
            color="primary"
            onClick={() => {
              handleNavigateStudentDetails(student.id);
            }}
          >
            <FaInfoCircle color="#fff" size={20} />
          </IconButton>
        ) : (
          <Button
            variant="contained"
            color="secondary"
            onClick={() => {
              removeStudent(student.id);
            }}
          >
            Remove
          </Button>
        )}
      </Box>
    </ListItem>
  );
};

export default StudentListCard;
