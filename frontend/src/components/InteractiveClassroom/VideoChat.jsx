import { useEffect, useRef, useState, useCallback } from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";

import WebRTCSocketService from "../../services/webrtcSocket";
import { useAuth } from "../../contexts/auth_context";
import { lumi, lumiType, tint } from "../luminous";

const STUN_URL = import.meta.env.VITE_STUN_URL;

const ICE_CONFIG = {
  iceServers: STUN_URL ? [{ urls: STUN_URL }] : [],
};

/**
 * 1:1 classroom call using the "perfect negotiation" pattern, so tracks can be
 * added/removed mid-call (screen share) from either side without glare. The
 * student is the polite peer. The peer connection only exists while both
 * parties are in the room; local media is captured up front for the self-view.
 *
 * Screen share rides the same P2P connection as the camera: an extra video
 * track in its own MediaStream, announced over signaling ("screen_share" with
 * the stream id) so the receiver can tell it apart from the camera stream.
 * The active presentation surfaces through `onPresentation` so the classroom
 * can render it in the main panel.
 */
const VideoChat = ({ roomId, onPresentation }) => {
  const { auth } = useAuth();
  const isTeacher = auth?.userType === "teacher";
  const polite = !isTeacher;

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const screenSendersRef = useRef([]);
  const pendingCandidatesRef = useRef([]);
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const remoteScreenStreamIdRef = useRef(null);
  const remoteStreamsRef = useRef(new Map()); // stream.id -> MediaStream
  const onPresentationRef = useRef(onPresentation);
  onPresentationRef.current = onPresentation;

  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [connected, setConnected] = useState(false);
  const [remoteUser, setRemoteUser] = useState(null);
  const [remoteMedia, setRemoteMedia] = useState({ mic: true, cam: true });
  const [sharing, setSharing] = useState(false);

  /** Route buffered remote streams: the announced screen stream goes to the
   * presentation surface, anything else is the camera. */
  const assignRemoteStreams = useCallback(() => {
    for (const [id, stream] of remoteStreamsRef.current) {
      if (id === remoteScreenStreamIdRef.current) {
        onPresentationRef.current?.({ stream, isLocal: false });
      } else if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    }
  }, []);

  const teardownPeer = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    screenSendersRef.current = [];
    pendingCandidatesRef.current = [];
    remoteStreamsRef.current.clear();
    remoteScreenStreamIdRef.current = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    onPresentationRef.current?.(null);
    setConnected(false);
  }, []);

  const createPeerConnection = useCallback(() => {
    teardownPeer();
    const pc = new RTCPeerConnection(ICE_CONFIG);
    pcRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        screenSendersRef.current.push(pc.addTrack(track, screenStreamRef.current));
      });
      socketRef.current?.send("screen_share", {
        active: true,
        streamId: screenStreamRef.current.id,
      });
    }

    pc.onnegotiationneeded = async () => {
      try {
        makingOfferRef.current = true;
        await pc.setLocalDescription();
        socketRef.current?.send("description", { sdp: pc.localDescription });
      } catch (err) {
        console.error("Negotiation failed:", err);
      } finally {
        makingOfferRef.current = false;
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.sendIceCandidate(event.candidate.toJSON());
      }
    };

    pc.ontrack = ({ streams }) => {
      const stream = streams[0];
      if (!stream) return;
      remoteStreamsRef.current.set(stream.id, stream);
      assignRemoteStreams();
      setConnected(true);
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") {
        pc.restartIce();
      } else if (pc.iceConnectionState === "disconnected") {
        setConnected(false);
      }
    };

    return pc;
  }, [assignRemoteStreams, teardownPeer]);

  const handleDescription = useCallback(
    async ({ sdp }) => {
      const pc = pcRef.current || createPeerConnection();
      const offerCollision =
        sdp.type === "offer" &&
        (makingOfferRef.current || pc.signalingState !== "stable");

      ignoreOfferRef.current = !polite && offerCollision;
      if (ignoreOfferRef.current) return;

      await pc.setRemoteDescription(sdp);

      for (const candidate of pendingCandidatesRef.current.splice(0)) {
        try {
          await pc.addIceCandidate(candidate);
        } catch (err) {
          if (!ignoreOfferRef.current) console.error(err);
        }
      }

      if (sdp.type === "offer") {
        await pc.setLocalDescription();
        socketRef.current?.send("description", { sdp: pc.localDescription });
      }
    },
    [polite, createPeerConnection]
  );

  const handleIceCandidate = useCallback(async ({ candidate }) => {
    const pc = pcRef.current;
    if (pc && pc.remoteDescription) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (err) {
        if (!ignoreOfferRef.current) console.error(err);
      }
    } else {
      pendingCandidatesRef.current.push(candidate);
    }
  }, []);

  const sendMediaState = useCallback((mic, cam) => {
    socketRef.current?.send("media_state", { mic, cam });
  }, []);

  const handlePeerPresent = useCallback(
    (userType) => {
      setRemoteUser(userType);
      createPeerConnection();
      sendMediaState(
        localStreamRef.current?.getAudioTracks()[0]?.enabled ?? false,
        localStreamRef.current?.getVideoTracks()[0]?.enabled ?? false
      );
    },
    [createPeerConnection, sendMediaState]
  );

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
        setMicEnabled(false);
        setCamEnabled(false);
      }

      if (!mounted) return;
      const socket = new WebRTCSocketService(roomId);
      socketRef.current = socket;

      socket.on("room_state", (payload) => {
        const other = payload.users.find(
          (u) => u.user_type === (isTeacher ? "student" : "teacher")
        );
        if (other) handlePeerPresent(other.user_type);
      });

      socket.on("user_joined", (payload) => {
        handlePeerPresent(payload.userType);
      });

      socket.on("user_left", () => {
        setRemoteUser(null);
        setRemoteMedia({ mic: true, cam: true });
        teardownPeer();
      });

      socket.on("description", handleDescription);
      socket.on("ice_candidate", handleIceCandidate);
      socket.on("call_end", teardownPeer);
      socket.on("media_state", (payload) => {
        setRemoteMedia({ mic: !!payload.mic, cam: !!payload.cam });
      });
      socket.on("screen_share", (payload) => {
        if (payload.active) {
          remoteScreenStreamIdRef.current = payload.streamId;
          assignRemoteStreams();
        } else {
          remoteScreenStreamIdRef.current = null;
          onPresentationRef.current?.(null);
        }
      });
    };

    init();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.sendCallEnd();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      teardownPeer();
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
  }, [
    roomId,
    isTeacher,
    handlePeerPresent,
    handleDescription,
    handleIceCandidate,
    teardownPeer,
    assignRemoteStreams,
  ]);

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicEnabled(track.enabled);
    sendMediaState(track.enabled, camEnabled);
  };

  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamEnabled(track.enabled);
    sendMediaState(micEnabled, track.enabled);
  };

  const stopShare = useCallback(() => {
    socketRef.current?.send("screen_share", { active: false });
    screenSendersRef.current.forEach((sender) => {
      try {
        pcRef.current?.removeTrack(sender);
      } catch {
        /* pc may already be closed */
      }
    });
    screenSendersRef.current = [];
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    onPresentationRef.current?.(null);
    setSharing(false);
  }, []);

  const startShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      track.onended = stopShare; // browser-level "Stop sharing" button

      socketRef.current?.send("screen_share", { active: true, streamId: stream.id });
      if (pcRef.current) {
        stream.getTracks().forEach((t) => {
          screenSendersRef.current.push(pcRef.current.addTrack(t, stream));
        });
      }
      onPresentationRef.current?.({ stream, isLocal: true });
      setSharing(true);
    } catch (err) {
      // User cancelled the picker — not an error.
      if (err.name !== "NotAllowedError") {
        console.error("Screen share failed:", err);
      }
    }
  };

  const controlSx = (active) => ({
    color: active ? lumi.color.onSurface : lumi.color.error,
    backgroundColor: active ? "transparent" : tint(lumi.color.error, 0.12),
    "&:hover": { backgroundColor: tint(lumi.color.primary, 0.15) },
  });

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
          minHeight: 0,
          position: "relative",
          backgroundColor: lumi.color.surfaceContainerLowest,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
            display: connected && remoteMedia.cam ? "block" : "none",
          }}
        />
        {(!connected || !remoteMedia.cam) && (
          <Typography
            sx={{
              ...lumiType.bodyMd,
              color: lumi.color.onSurfaceVariant,
              textAlign: "center",
              px: 1.5,
            }}
          >
            {connected
              ? "Camera off"
              : remoteUser
                ? "Connecting…"
                : `Waiting for ${isTeacher ? "student" : "teacher"}…`}
          </Typography>
        )}

        {/* Remote identity + mic state */}
        {connected && (
          <Box
            sx={{
              position: "absolute",
              top: 6,
              left: 6,
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              px: 1,
              py: 0.25,
              borderRadius: lumi.radius.pill,
              backgroundColor: "rgba(6, 14, 32, 0.7)",
            }}
          >
            <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurface }}>
              {remoteUser === "teacher" ? "Teacher" : "Student"}
            </Typography>
            {!remoteMedia.mic && (
              <MicOffIcon sx={{ fontSize: 14, color: lumi.color.error }} />
            )}
          </Box>
        )}

        {/* Local self-view */}
        <Box
          sx={{
            position: "absolute",
            bottom: 6,
            right: 6,
            width: 88,
            height: 64,
            borderRadius: lumi.radius.md,
            overflow: "hidden",
            border: `1px solid ${lumi.color.outlineVariant}`,
            backgroundColor: lumi.color.surfaceContainerLowest,
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
      </Box>

      {/* Controls */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 0.5,
          py: 0.5,
          backgroundColor: lumi.color.surfaceContainer,
          borderTop: `1px solid ${lumi.color.hairline}`,
        }}
      >
        <Tooltip title={micEnabled ? "Mute microphone" : "Unmute microphone"}>
          <IconButton data-testid="toggle-mic" onClick={toggleMic} size="small" sx={controlSx(micEnabled)}>
            {micEnabled ? <MicIcon fontSize="small" /> : <MicOffIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title={camEnabled ? "Turn camera off" : "Turn camera on"}>
          <IconButton data-testid="toggle-cam" onClick={toggleCam} size="small" sx={controlSx(camEnabled)}>
            {camEnabled ? <VideocamIcon fontSize="small" /> : <VideocamOffIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title={sharing ? "Stop sharing your screen" : "Share your screen"}>
          <IconButton
            data-testid="toggle-share"
            onClick={sharing ? stopShare : startShare}
            size="small"
            sx={{
              color: sharing ? lumi.color.tertiary : lumi.color.onSurface,
              backgroundColor: sharing ? tint(lumi.color.tertiary, 0.15) : "transparent",
              "&:hover": { backgroundColor: tint(lumi.color.primary, 0.15) },
            }}
          >
            {sharing ? (
              <StopScreenShareIcon fontSize="small" />
            ) : (
              <ScreenShareIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default VideoChat;
