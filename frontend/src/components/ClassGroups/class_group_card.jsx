import React from "react";
import { Box, Typography, AvatarGroup, Avatar, Button, Chip } from "@mui/material";
import { getSubjectIcon } from "../../utils/icons";
import { FaChevronRight } from "react-icons/fa";

const ClassGroupCard = ({ data, onClick }) => {
  return (
    <Box
      sx={{
        p: 2,
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
      <Typography variant="h6" noWrap sx={{ maxWidth: "100%" }}>
        {data.name}
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          gap: 1,
          mt: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.5,
            flex: "1 1 auto",
            minWidth: 0,
          }}
        >
          {data.subjects.map((subject) => {
            const SubjectIcon = getSubjectIcon(subject.name);
            return (
              <Chip
                key={subject.name}
                icon={<SubjectIcon color="#fff" size={18} />}
                label={subject.name}
                size="small"
                sx={{
                  color: "#fff",
                  maxWidth: "100%",
                  backgroundColor: subject.color,
                }}
              />
            );
          })}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
          <AvatarGroup max={4}>
            {data.students.map((student) => (
              <Avatar
                key={student.id}
                src={student.profile_picture || undefined}
                alt={student.first_name}
                sx={{ width: 32, height: 32 }}
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
    </Box>
  );
};

export default ClassGroupCard;
