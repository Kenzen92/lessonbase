import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";

import ExcalidrawBoard from "./ExcalidrawBoard";
import VideoChat from "./VideoChat";
import TextChat from "./TextChat";
import PostClassFeedbackModal from "./PostClassFeedbackModal";
import ClassroomResourceDrawer from "./ClassroomResourceDrawer";
import { lumi, lumiType, tint, LumiIcon, SubjectChip } from "../luminous";
import { getToken } from "../../utils/tokenStorage";

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

const panelSx = {
  backgroundColor: lumi.color.surfaceContainerLow,
  border: `1px solid ${lumi.color.hairline}`,
  borderRadius: lumi.radius.card,
  overflow: "hidden",
};

/** Live dot + label for the board's sync connection. */
const ConnectionPill = ({ connected }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 0.75,
      px: 1.25,
      py: 0.5,
      borderRadius: lumi.radius.pill,
      backgroundColor: tint(connected ? lumi.color.tertiary : lumi.color.amber, 0.12),
    }}
  >
    <Box
      sx={{
        width: 7,
        height: 7,
        borderRadius: "50%",
        backgroundColor: connected ? lumi.color.tertiary : lumi.color.amber,
      }}
    />
    <Typography
      sx={{
        ...lumiType.labelMd,
        color: connected ? lumi.color.tertiary : lumi.color.amberText,
      }}
    >
      {connected ? "LIVE" : "RECONNECTING"}
    </Typography>
  </Box>
);

const InteractiveClassroom = () => {
  const { accessToken } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classroomData, setClassroomData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [boardConnected, setBoardConnected] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [presentation, setPresentation] = useState(null); // { stream, isLocal }
  const [showBoardWhilePresenting, setShowBoardWhilePresenting] = useState(false);

  const boardApiRef = useRef(null);
  const presentationVideoRef = useRef(null);

  useEffect(() => {
    if (!accessToken) {
      navigate("/dashboard");
      return;
    }

    const validateAccess = async () => {
      try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/classroom/validate/${accessToken}/`, {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
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
        setUserRole(data.user_role);
        setLoading(false);
      } catch (err) {
        console.error("Error validating classroom access:", err);
        setError("Failed to connect to classroom. Please check your connection.");
        setTimeout(() => navigate("/dashboard"), 3000);
      }
    };

    validateAccess();
  }, [accessToken, navigate]);

  const handlePresentation = useCallback((next) => {
    setPresentation(next);
    setShowBoardWhilePresenting(false);
  }, []);

  // (Re)bind the presentation stream whenever the overlay is visible.
  useEffect(() => {
    if (presentation && presentationVideoRef.current) {
      presentationVideoRef.current.srcObject = presentation.stream;
    }
  }, [presentation, showBoardWhilePresenting]);

  const handleExit = () => {
    if (userRole === "student") {
      setShowFeedbackModal(true);
    } else {
      navigate("/dashboard");
    }
  };

  if (loading || error) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: lumi.color.background,
          p: 3,
        }}
      >
        {error ? (
          <Alert severity="error" sx={{ maxWidth: 500 }}>
            {error}
          </Alert>
        ) : (
          <CircularProgress sx={{ color: lumi.color.primary }} />
        )}
      </Box>
    );
  }

  const presentationVisible = presentation && !showBoardWhilePresenting;

  return (
    <Box
      sx={{
        height: "100vh",
        backgroundColor: lumi.color.background,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Top bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1,
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{ ...lumiType.headlineMd, color: lumi.color.onBackground }}
          noWrap
        >
          {classroomData?.name || "Classroom"}
        </Typography>
        <SubjectChip
          label={classroomData?.classroom_type === "practice" ? "Practice" : "Live class"}
          accent={classroomData?.classroom_type === "practice" ? "violet" : "primary"}
        />
        <ConnectionPill connected={boardConnected} />

        <Box sx={{ flex: 1 }} />

        <Tooltip title={userRole === "teacher" ? "Teaching resources" : "Class resources"}>
          <IconButton
            data-testid="open-resources-btn"
            onClick={() => setResourcesOpen(true)}
            sx={{
              color: lumi.color.onSurfaceVariant,
              "&:hover": { color: lumi.color.primary, backgroundColor: tint(lumi.color.primary, 0.12) },
            }}
          >
            <LumiIcon name="folder_open" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Exit classroom">
          <IconButton
            data-testid="exit-classroom-btn"
            onClick={handleExit}
            sx={{
              color: lumi.color.error,
              "&:hover": { backgroundColor: tint(lumi.color.error, 0.12) },
            }}
          >
            <LumiIcon name="logout" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Main row */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          gap: 1.5,
          px: 1.5,
          pb: 1.5,
        }}
      >
        {/* Board / presentation area */}
        <Box sx={{ ...panelSx, flex: 1, minWidth: 0, position: "relative" }}>
          <ExcalidrawBoard
            roomId={accessToken}
            onApiReady={(api) => {
              boardApiRef.current = api;
            }}
            onConnectionChange={setBoardConnected}
            onLibraryOpen={() => setResourcesOpen(true)}
          />

          {/* Screen share overlay — board stays mounted underneath. */}
          {presentationVisible && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                zIndex: 10,
                display: "flex",
                flexDirection: "column",
                backgroundColor: lumi.color.surfaceContainerLowest,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2,
                  py: 0.75,
                  backgroundColor: lumi.color.surfaceContainer,
                  borderBottom: `1px solid ${lumi.color.hairline}`,
                }}
              >
                <Typography sx={{ ...lumiType.labelMd, color: lumi.color.tertiary }}>
                  {presentation.isLocal
                    ? "YOU ARE PRESENTING"
                    : `${userRole === "teacher" ? "STUDENT" : "TEACHER"} IS PRESENTING`}
                </Typography>
                <Button
                  size="small"
                  onClick={() => setShowBoardWhilePresenting(true)}
                  sx={{
                    ...lumiType.buttonText,
                    color: lumi.color.primary,
                    "&:hover": { backgroundColor: tint(lumi.color.primary, 0.12) },
                  }}
                >
                  Show whiteboard
                </Button>
              </Box>
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <video
                  ref={presentationVideoRef}
                  autoPlay
                  playsInline
                  muted={presentation.isLocal}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </Box>
            </Box>
          )}

          {/* Floating pill to return to the share when peeking at the board. */}
          {presentation && showBoardWhilePresenting && (
            <Button
              size="small"
              onClick={() => setShowBoardWhilePresenting(false)}
              sx={{
                ...lumiType.buttonText,
                position: "absolute",
                top: 12,
                right: 12,
                zIndex: 10,
                px: 1.5,
                borderRadius: lumi.radius.pill,
                color: lumi.color.onPrimary,
                backgroundColor: lumi.color.primary,
                "&:hover": { backgroundColor: lumi.color.primaryFixed },
              }}
            >
              Back to screen share
            </Button>
          )}
        </Box>

        {/* Right rail */}
        <Box
          sx={{
            width: 300,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            minHeight: 0,
          }}
        >
          <Box sx={{ ...panelSx, height: 280, flexShrink: 0 }}>
            <VideoChat roomId={accessToken} onPresentation={handlePresentation} />
          </Box>
          <Box sx={{ ...panelSx, flex: 1, minHeight: 0 }}>
            <TextChat roomId={accessToken} />
          </Box>
        </Box>
      </Box>

      <ClassroomResourceDrawer
        open={resourcesOpen}
        onClose={() => setResourcesOpen(false)}
        getBoardApi={() => boardApiRef.current}
        classEventId={classroomData?.id}
        userRole={userRole}
      />

      <PostClassFeedbackModal open={showFeedbackModal} classEventId={classroomData?.id} />
    </Box>
  );
};

export default InteractiveClassroom;
