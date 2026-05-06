import { useEffect, useRef, useState, useCallback } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import WebRTCSocketService from "../../services/webrtcSocket";
import { useAuth } from "../../contexts/auth_context";

const STUN_URL = import.meta.env.VITE_STUN_URL;

const ICE_CONFIG = {
  iceServers: [{ urls: STUN_URL }],
};

const VideoChat = ({ roomId }) => {
  const { auth } = useAuth();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [connected, setConnected] = useState(false);
  const [remoteUser, setRemoteUser] = useState(null);

  const isTeacher = auth?.userType === "teacher";

  const createPeerConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
    }

    const pc = new RTCPeerConnection(ICE_CONFIG);
    pcRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setConnected(true);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.sendIceCandidate(event.candidate.toJSON());
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (
        pc.iceConnectionState === "disconnected" ||
        pc.iceConnectionState === "failed"
      ) {
        setConnected(false);
      }
    };

    return pc;
  }, []);

  const startCall = useCallback(async () => {
    const pc = createPeerConnection();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current.sendOffer(pc.localDescription);
  }, [createPeerConnection]);

  const handleOffer = useCallback(
    async (payload) => {
      const pc = createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));

      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidatesRef.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current.sendAnswer(pc.localDescription);
    },
    [createPeerConnection],
  );

  const handleAnswer = useCallback(async (payload) => {
    if (pcRef.current) {
      await pcRef.current.setRemoteDescription(
        new RTCSessionDescription(payload.sdp),
      );

      for (const candidate of pendingCandidatesRef.current) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidatesRef.current = [];
    }
  }, []);

  const handleIceCandidate = useCallback(async (payload) => {
    if (pcRef.current && pcRef.current.remoteDescription) {
      await pcRef.current.addIceCandidate(
        new RTCIceCandidate(payload.candidate),
      );
    } else {
      pendingCandidatesRef.current.push(payload.candidate);
    }
  }, []);

  const handleCallEnd = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setConnected(false);
    setRemoteUser(null);
  }, []);

  useEffect(() => {
    if (!roomId) return;

    let mounted = true;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Failed to get user media:", err);
      }

      const socket = new WebRTCSocketService(roomId);
      socketRef.current = socket;

      socket.on("room_state", (payload) => {
        const hasStudent = payload.users.some((u) => u.user_type === "student");
        const hasTeacher = payload.users.some((u) => u.user_type === "teacher");
        if (isTeacher && hasStudent) {
          setRemoteUser("student");
          startCall();
        } else if (!isTeacher && hasTeacher) {
          setRemoteUser("teacher");
        }
      });

      socket.on("user_joined", (payload) => {
        setRemoteUser(payload.userType);
        if (isTeacher && payload.userType === "student") {
          startCall();
        }
      });

      socket.on("user_left", () => {
        handleCallEnd();
      });

      socket.on("offer", handleOffer);
      socket.on("answer", handleAnswer);
      socket.on("ice_candidate", handleIceCandidate);
      socket.on("call_end", handleCallEnd);
    };

    init();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.sendCallEnd();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
  }, [
    roomId,
    isTeacher,
    startCall,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    handleCallEnd,
  ]);

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleCam = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCamEnabled(videoTrack.enabled);
      }
    }
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Remote video */}
      <Box
        sx={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 0,
        }}
      >
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: connected ? "block" : "none",
          }}
        />
        {!connected && (
          <Typography
            sx={{
              color: "rgba(255, 255, 255, 0.5)",
              fontSize: "0.8rem",
              textAlign: "center",
              px: 1,
            }}
          >
            {remoteUser
              ? "Connecting..."
              : `Waiting for ${isTeacher ? "student" : "teacher"}...`}
          </Typography>
        )}
      </Box>

      {/* Local video (small overlay) */}
      <Box
        sx={{
          position: "absolute",
          bottom: 48,
          right: 8,
          width: 80,
          height: 60,
          borderRadius: "8px",
          overflow: "hidden",
          border: "2px solid rgba(255, 255, 255, 0.3)",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      >
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1)",
          }}
        />
      </Box>

      {/* Controls */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 1,
          py: 0.5,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
        }}
      >
        <IconButton
          onClick={toggleMic}
          size="small"
          sx={{ color: micEnabled ? "#fff" : "#ff6b6b" }}
        >
          {micEnabled ? (
            <MicIcon fontSize="small" />
          ) : (
            <MicOffIcon fontSize="small" />
          )}
        </IconButton>
        <IconButton
          onClick={toggleCam}
          size="small"
          sx={{ color: camEnabled ? "#fff" : "#ff6b6b" }}
        >
          {camEnabled ? (
            <VideocamIcon fontSize="small" />
          ) : (
            <VideocamOffIcon fontSize="small" />
          )}
        </IconButton>
      </Box>
    </Box>
  );
};

export default VideoChat;
