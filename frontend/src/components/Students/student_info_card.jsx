import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Avatar,
  Button,
  Tooltip,
  Chip,
  Divider,
} from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { FaChevronRight } from "react-icons/fa";
import ClassGroupChip from "../ClassGroups/class_group_chip";

const StudentInfoCard = ({
  student,
  setDrawerOpen,
  setCurrentStudent,
  setChatOpen,
  setChatId,
  chats,
}) => {
  const [chatId, setChatIdState] = useState(null);

  useEffect(() => {
    if (student) {
      const chat = chats.find((chat) => chat.participants.includes(student.id));
      setChatIdState(chat ? chat.id : null);
    }
  }, [student, chats]);

  const isActive = student.status === "active";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        py: 1.5,
        borderRadius: 2,
        backgroundColor: "#222",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        border: "1px solid #333",
        transition: "all 0.2s ease",
        "&:hover": {
          backgroundColor: "#2e2e2e",
          borderColor: "primary.main",
        },
      }}
    >
      {/* Left section: avatar + name + email */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 2 }}>
        <Avatar
          alt={student.first_name}
          src={student.profile_picture}
          sx={{ width: 44, height: 44, bgcolor: "#555" }}
        >
          {student.first_name ? student.first_name[0] : "?"}
        </Avatar>
        <Box>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, color: "white" }}
          >
            {student.first_name} {student.last_name}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}
          >
            {student.email || "No email available"}
          </Typography>
        </Box>
      </Box>

      {/* Middle section: classes */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          justifyContent: "center",
          flex: 2,
        }}
      >
        {student.class_groups.map((group) => (
          <ClassGroupChip key={group.id} classGroup={group} />
        ))}
      </Box>

      {/* Right section: details */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 1.5,
          flex: 1.5,
        }}
      >
        {/* Status chip */}
        <Chip
          label={isActive ? "Active" : "Inactive"}
          size="small"
          sx={{
            bgcolor: isActive ? "success.main" : "grey.700",
            color: "white",
            fontWeight: 500,
          }}
        />

        {/* Avg assignments */}
        {student.avg_assignments !== undefined && (
          <Tooltip title="Average Assignments">
            <Chip
              label={`${student.avg_assignments.toFixed(1)} Avg`}
              size="small"
              sx={{
                bgcolor: "primary.dark",
                color: "white",
                fontWeight: 500,
              }}
            />
          </Tooltip>
        )}

        <Divider orientation="vertical" flexItem sx={{ bgcolor: "#444" }} />

        {/* Chat Button */}
        <Button
          data-testid={`student-chat-button-${student.id}`}
          variant="contained"
          size="small"
          startIcon={<ChatBubbleOutlineIcon />}
          sx={{
            backgroundColor: "primary.main",
            textTransform: "none",
            fontSize: "0.75rem",
            "&:hover": { backgroundColor: "primary.dark" },
          }}
          onClick={(event) => {
            event.stopPropagation();
            setCurrentStudent(student);
            if (chatId) {
              setChatId(chatId);
              setChatOpen(true);
              return;
            }

            setDrawerOpen(true);
          }}
        >
          Chat
        </Button>

        {/* Details Button */}
        <Button
          onClick={() => {
            setCurrentStudent(student);
            setDrawerOpen(true);
          }}
          startIcon={<FaChevronRight color="white" />}
          sx={{
            color: "#fff",
            textTransform: "none",
            fontSize: "0.95rem",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
          }}
        >
          {" "}
          Details{" "}
        </Button>
      </Box>
    </Box>
  );
};

export default StudentInfoCard;
