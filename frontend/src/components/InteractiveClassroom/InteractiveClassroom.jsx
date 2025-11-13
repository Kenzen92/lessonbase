import React, { useState, useEffect } from "react";
import { Box, Grid, Paper, IconButton, Tooltip } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import FolderIcon from "@mui/icons-material/Folder";
import SettingsIcon from "@mui/icons-material/Settings";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import Whiteboard from "./Whiteboard";
import VideoChat from "./VideoChat";
import TextChat from "./TextChat";

const InteractiveClassroom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedTool, setSelectedTool] = useState("pen");
  const [selectedToolSize, setSelectedToolSize] = useState(2);

  useEffect(() => {
    if (!id) {
      navigate("/dashboard");
      return;
    }

    // Load class event details or set up WebSocket connection
  }, [id, navigate]);

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
              roomId={id}
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
