import React from "react";
import {
  Box,
  Typography,
  ListItem,
  Checkbox,
  Avatar,
  Chip,
} from "@mui/material";
import inputStyle from "../../styles/input";

const StudentSelectCard = ({
  student,
  setSelectedStudents,
  selectedStudents,
}) => {
  const isSelected = selectedStudents.includes(student.id);

  const handleToggle = () => {
    if (isSelected) {
      setSelectedStudents(selectedStudents.filter((id) => id !== student.id));
    } else {
      setSelectedStudents([...selectedStudents, student.id]);
    }
  };

  return (
    <ListItem
      alignItems="flex-start"
      sx={{
        px: 2,
        py: 1.5,
        justifyContent: "space-between",
        cursor: "pointer",
        borderRadius: "8px",
        transition: "background-color 0.2s",
        "&:hover": {
          backgroundColor: "rgba(255, 255, 255, 0.05)",
        },
        backgroundColor: isSelected ? "rgba(0, 176, 255, 0.1)" : "transparent",
      }}
      onClick={handleToggle}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 2,
          flex: 1,
        }}
      >
        <Checkbox
          checked={isSelected}
          onChange={handleToggle}
          onClick={(e) => e.stopPropagation()}
          sx={{
            color: "#fff",
            "&.Mui-checked": {
              color: "#00b0ff",
            },
          }}
        />
        <Avatar alt={student.first_name} src={student.avatar} />
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ color: "#fff", fontWeight: 500 }}>
            {student.first_name} {student.last_name}
          </Typography>
          <Typography sx={{ color: "#999", fontSize: "0.875rem" }}>
            {student.username}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          {student.class_groups?.slice(0, 3).map((group) => (
            <Chip
              key={group.id}
              label={group.name}
              size="small"
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "#fff",
                fontSize: "0.75rem",
              }}
            />
          ))}
          {student.class_groups?.length > 3 && (
            <Chip
              label={`+${student.class_groups.length - 3}`}
              size="small"
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "#fff",
                fontSize: "0.75rem",
              }}
            />
          )}
        </Box>
      </Box>
    </ListItem>
  );
};

export default StudentSelectCard;
