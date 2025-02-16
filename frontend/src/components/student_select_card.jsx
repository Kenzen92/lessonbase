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

const StudentSelectCard = ({
  student,
  setSelectedStudents,
  selectedStudents,
}) => {
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
        {selectedStudents.includes(student.id) ? (
          <Button
            variant="contained"
            color="secondary"
            onClick={() => {
              setSelectedStudents(
                selectedStudents.filter((id) => id !== student.id)
              );
            }}
          >
            Deselect
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setSelectedStudents([...selectedStudents, student.id]);
            }}
          >
            Select
          </Button>
        )}
      </Box>
    </ListItem>
  );
};

export default StudentSelectCard;
