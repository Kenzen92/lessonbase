import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  Divider,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Button,
  Avatar,
} from "@mui/material";
import inputStyle from "../styles/input";

const StudentListCard = ({ student, removeStudent }) => {
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
        <Button
          variant="contained"
          color="secondary"
          onClick={() => {
            removeStudent(student.id);
          }}
        >
          Remove
        </Button>
      </Box>
    </ListItem>
  );
};

export default StudentListCard;
