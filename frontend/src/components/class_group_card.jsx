import React from "react";
import { Box, Typography, AvatarGroup, Avatar, Button } from "@mui/material";

const ClassGroupCard = ({ data, onClick }) => {
  console.log(data);
  return (
    <Box
      sx={{
        p: 3,
        boxShadow: 3,
        borderRadius: 2,
        maxWidth: "15rem",
        boxShadow: 5,
        border: 2,
        borderColor: "#333",
        height: "12rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Typography variant="h6">{data.name}</Typography>
      <Typography variant="body2">{data.description}</Typography>

      <AvatarGroup max={4}>
        {data.students.map((student) => (
          <Avatar key={student} src={student.profile_pic} />
        ))}
      </AvatarGroup>

      <Button variant="contained" size="small" onClick={onClick}>
        View Details
      </Button>
    </Box>
  );
};

export default ClassGroupCard;
