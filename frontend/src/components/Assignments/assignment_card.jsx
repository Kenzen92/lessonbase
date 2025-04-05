import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import { PrimaryButton } from "../../styles/buttons";
import { toast } from "react-toastify";
import inputStyle from "../../styles/input";

const TabPanel = ({ children, value, index }) => (
  <Box hidden={value !== index} sx={{ p: 2 }}>
    {value === index && children}
  </Box>
);

const AssignmentCard = ({
  assignment,
  setDrawerOpen,
  setCurrentAssignment,
}) => {
  return (
    <Box
      sx={{
        boxShadow: 2,
        p: 0.2,
        borderColor: "#fff",
        borderRadius: "10px",
        borderStyle: "solid",
        backgroundColor: "#292929",
      }}
    >
      <Typography variant="h6" gutterBottom>
        {assignment.title}
      </Typography>

      <Box>
        <Typography variant="body1" gutterBottom>
          {assignment.description}
        </Typography>
        <Typography variant="body2" gutterBottom>
          Due Date: {new Date(assignment.due_date).toLocaleDateString()}
        </Typography>
        <PrimaryButton
          onClick={() => {
            setCurrentAssignment(assignment);
            setDrawerOpen(true);
          }}
        >
          Details
        </PrimaryButton>
      </Box>
    </Box>
  );
};

export default AssignmentCard;
