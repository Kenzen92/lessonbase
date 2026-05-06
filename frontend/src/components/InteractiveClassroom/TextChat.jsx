import { useEffect, useRef, useState } from "react";
import { Box, Typography, TextField, IconButton } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useAuth } from "../../contexts/auth_context";

function getWebSocketURL(path) {
  const WEBSOCKET_URL = import.meta.env.VITE_REACT_APP_WEBSOCKET_URL;
  if (!WEBSOCKET_URL) {
    throw new Error("VITE_REACT_APP_WEBSOCKET_URL environment variable is not set");
  }
  return `${WEBSOCKET_URL}${path}`;
}

const TextChat = ({ roomId }) => {
  const { auth } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;

    const token = window.sessionStorage.getItem("token");
    const wsUrl = `${getWebSocketURL(`/chat/${roomId}/`)}?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };

    ws.onerror = (error) => {
      console.error("Chat WebSocket error:", error);
    };

    ws.onclose = (event) => {
      if (event.code === 4001 || event.code === 4003) return;
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ message: text }));
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const currentUsername = auth?.user?.username;

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box sx={{ px: 1.5, py: 1, flexShrink: 0 }}>
        <Typography variant="subtitle2" sx={{ color: "rgba(255,255,255,0.8)" }}>
          Chat
        </Typography>
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 1.5,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          minHeight: 0,
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(255,255,255,0.2)",
            borderRadius: 2,
          },
        }}
      >
        {messages.map((msg, i) => {
          const isOwn = msg.sender === currentUsername;
          return (
            <Box
              key={i}
              sx={{
                alignSelf: isOwn ? "flex-end" : "flex-start",
                maxWidth: "85%",
                backgroundColor: isOwn
                  ? "rgba(33, 150, 243, 0.3)"
                  : "rgba(255, 255, 255, 0.08)",
                borderRadius: "8px",
                px: 1,
                py: 0.5,
              }}
            >
              {!isOwn && (
                <Typography
                  sx={{
                    color: "rgba(33, 150, 243, 0.9)",
                    fontSize: "0.65rem",
                    fontWeight: 600,
                  }}
                >
                  {msg.sender}
                </Typography>
              )}
              <Typography sx={{ color: "#fff", fontSize: "0.75rem", wordBreak: "break-word" }}>
                {msg.message}
              </Typography>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Box sx={{ display: "flex", alignItems: "center", px: 1, py: 0.5, gap: 0.5 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{
            "& .MuiOutlinedInput-root": {
              color: "#fff",
              fontSize: "0.75rem",
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: "8px",
              "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
              "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
              "&.Mui-focused fieldset": { borderColor: "rgba(33,150,243,0.5)" },
            },
          }}
        />
        <IconButton onClick={sendMessage} size="small" sx={{ color: "rgba(33,150,243,0.8)" }}>
          <SendIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default TextChat;
