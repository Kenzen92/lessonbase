import React from "react";
import {
  Box,
  Typography,
  AvatarGroup,
  Avatar,
  Button,
  Chip,
  IconButton,
} from "@mui/material";
import { getSubjectIcon } from "../../utils/icons";
import { FaChevronRight } from "react-icons/fa";

const ClassGroupCard = ({ data, onClick }) => {
  return (
    <Box
      sx={{
        p: 2,
        boxShadow: 3,
        borderRadius: 2,
        boxShadow: 5,
        border: 2,
        borderColor: "#333",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Typography variant="h6">{data.name}</Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          gap: 3,
          mt: 2,
        }}
      >
        {data.subjects.map((subject) => {
          const SubjectIcon = getSubjectIcon(subject.name);
          return (
            <Chip
              key={subject.name}
              icon={<SubjectIcon color="#fff" size={20} />}
              label={subject.name}
              sx={{
                color: "#fff",
                fontSize: "smaller",
                mt: "0.5rem",
                height: "2.2rem",
                minWidth: "10rem",
                backgroundColor: subject.color,
              }}
            />
          );
        })}
        <AvatarGroup max={4}>
          {data.students.map((student) => (
            <Avatar
              key={student.id}
              src={student.profile_picture || undefined}
              alt={student.first_name}
            >
              {student.first_name?.[0]}
              {student.last_name?.[0]}
            </Avatar>
          ))}
        </AvatarGroup>

        <Button
          onClick={onClick}
          startIcon={<FaChevronRight color="white" />}
          sx={{
            color: "#fff",
            textTransform: "none",
            fontSize: "0.95rem",
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.1)",
            },
          }}
        >
          Details
        </Button>
      </Box>
    </Box>
  );
};

export default ClassGroupCard;
