import React, { useState, useEffect } from "react";
import { Box, Grid, Paper, IconButton, Tooltip, CircularProgress, Alert } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import FolderIcon from "@mui/icons-material/Folder";
import SettingsIcon from "@mui/icons-material/Settings";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import Whiteboard from "./Whiteboard";
import VideoChat from "./VideoChat";
import TextChat from "./TextChat";

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

const InteractiveClassroom = () => {
  const { accessToken } = useParams();
  const navigate = useNavigate();
  const [selectedTool, setSelectedTool] = useState("pen");
  const [selectedToolSize, setSelectedToolSize] = useState(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classroomData, setClassroomData] = useState(null);

  useEffect(() => {
    if (!accessToken) {
      navigate("/dashboard");
      return;
    }

    const validateAccess = async () => {
      try {
        const token = window.sessionStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/classroom/validate/${accessToken}/`, {
          headers: {
            "Authorization": `Token ${token}`,
            "Content-Type": "application/json"
          }
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.expired) {
            setError("This classroom has expired and is no longer available.");
          } else if (data.forbidden) {
            setError("You do not have permission to access this classroom.");
          } else if (data.not_found) {
            setError("Classroom not found. Please check your link.");
          } else {
            setError("Unable to access classroom. Please try again.");
          }
          setTimeout(() => navigate("/dashboard"), 3000);
          return;
        }

        setClassroomData(data.classroom);
        setLoading(false);
      } catch (err) {
        console.error("Error validating classroom access:", err);
        setError("Failed to connect to classroom. Please check your connection.");
        setTimeout(() => navigate("/dashboard"), 3000);
      }
    };

    validateAccess();
  }, [accessToken, navigate]);

  if (loading) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1a1a"
        }}
      >
        <CircularProgress sx={{ color: "#fff" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1a1a",
          p: 3
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100vh",
        backgroundColor: "#1a1a1a",
        p: 2,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <Grid container spacing={2} sx={{ height: "100%", overflow: "hidden" }}>
        {/* Main Content Area - Whiteboard */}
        <Grid size={10} sx={{ display: "flex", flexDirection: "column" }}>
          <Paper
            sx={{
              height: "100%",
              backgroundColor: "rgba(38, 38, 38, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              overflow: "hidden"
            }}
          >
            <Whiteboard
              selectedTool={selectedTool}
              setSelectedTool={setSelectedTool}
              selectedToolSize={selectedToolSize}
              setSelectedToolSize={setSelectedToolSize}
              roomId={accessToken}
            />
          </Paper>
        </Grid>

        {/* Sidebar - Video and Text Chat */}
        <Grid
          size={2}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            minHeight: 0,
            maxHeight: "100%"
          }}
        >
          {/* Top Controls - Fixed Height */}
          <Paper
            sx={{
              height: "60px",
              flexShrink: 0,
              backgroundColor: "rgba(38, 38, 38, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              px: 1,
            }}
          >
            <Tooltip title="Files" arrow>
              <IconButton
                sx={{
                  color: "rgba(255, 255, 255, 0.7)",
                  "&:hover": {
                    color: "#fff",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                <FolderIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings" arrow>
              <IconButton
                sx={{
                  color: "rgba(255, 255, 255, 0.7)",
                  "&:hover": {
                    color: "#fff",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Paper>

          {/* Video Chat - Takes 2 parts of flexible space */}
          <Paper
            sx={{
              flexGrow: 2,
              flexShrink: 1,
              flexBasis: 0,
              minHeight: 0,
              backgroundColor: "rgba(38, 38, 38, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              overflow: "hidden"
            }}
          >
            <VideoChat />
          </Paper>

          {/* Text Chat - Takes 3 parts of flexible space */}
          <Paper
            sx={{
              flexGrow: 3,
              flexShrink: 1,
              flexBasis: 0,
              minHeight: 0,
              backgroundColor: "rgba(38, 38, 38, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              overflow: "hidden"
            }}
          >
            <TextChat />
          </Paper>

          {/* Exit Button - Fixed Height */}
          <Paper
            sx={{
              height: "60px",
              flexShrink: 0,
              backgroundColor: "rgba(38, 38, 38, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Tooltip title="Exit Classroom" arrow>
              <IconButton
                onClick={() => navigate("/dashboard")}
                sx={{
                  color: "rgba(255, 100, 100, 0.8)",
                  "&:hover": {
                    color: "#ff6b6b",
                    backgroundColor: "rgba(255, 100, 100, 0.1)",
                  },
                }}
              >
                <ExitToAppIcon />
              </IconButton>
            </Tooltip>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InteractiveClassroom;
