import React, { useState, useEffect, useRef } from "react";
import WebSocketInstance from "./web_socket_service";
import {
  Box,
  Button,
  IconButton,
  Paper,
  TextField,
  Typography,
  Divider,
} from "@mui/material";
import moment from "moment";

const Chat = ({
  studentName,
  chatId,
  chatOpen,
  setChatOpen,
  currentUserId,
}) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMessages([]);
    const auth = window.sessionStorage.getItem("token");
    WebSocketInstance.connect(chatId, auth);
    WebSocketInstance.addCallbacks(messageCallback);

    return () => {
      WebSocketInstance.disconnect();
    };
  }, [chatId]);

  // Scroll to bottom when messages load or new message is added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages]); // Runs every time messages update

  const messageCallback = (parsedData) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        message: parsedData.message,
        timestamp: parsedData.timestamp,
        sender: parsedData.sender,
      },
    ]);
  };

  const sendMessageHandler = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const messageObject = {
        message: message,
        command: "message",
      };
      WebSocketInstance.sendMessage(messageObject);
      setMessage("");
    }
  };

  const closeChat = () => {
    WebSocketInstance.disconnect();
    setChatOpen(false);
  };

  const Timestamp = ({ timestamp }) =>
    moment(timestamp).format("MMM Do [at] HH:mm");

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 20,
        right: 20,
        width: 300,
        bgcolor: "background.paper",
        boxShadow: 3,
        borderRadius: 1,
        overflow: "hidden",
      }}
    >
      <Paper
        elevation={3}
        sx={{ bgcolor: "grey.900", color: "white", padding: 2 }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Chat with {studentName}
          </Typography>
          <IconButton onClick={closeChat} color="inherit">
            Close
          </IconButton>
        </Box>
        <Divider sx={{ my: 1, bgcolor: "grey.700" }} />
        <Box
          ref={messagesEndRef} // Attach ref to the Box
          sx={{
            maxHeight: 300,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 1,
            mb: 2,
          }}
        >
          {messages.map((msg, index) => (
            <Box
              key={index}
              sx={{
                alignSelf:
                  msg.sender.id === currentUserId ? "flex-end" : "flex-start",
                bgcolor:
                  msg.sender.id === currentUserId ? "primary.main" : "grey.800",
                color: msg.sender.id === currentUserId ? "white" : "grey.300",
                px: 2,
                py: 1,
                borderRadius: 2,
                maxWidth: "80%",
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontSize: "0.8rem", color: "grey.500" }}
              >
                <Timestamp timestamp={msg.timestamp} />
              </Typography>
              {msg.sender.id !== currentUserId && (
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  {msg.sender.username}
                </Typography>
              )}
              <Typography variant="body1">{msg.message}</Typography>
            </Box>
          ))}
        </Box>
        <form onSubmit={sendMessageHandler}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault(); // Prevent adding a new line
                sendMessageHandler(e); // Trigger message sending
              }
            }}
            multiline
            rows={isFocused ? 2 : 1}
            sx={{
              bgcolor: "grey.800",
              borderRadius: 1,
              mb: 1,
              "& .MuiOutlinedInput-root": {
                color: "white",
              },
            }}
            InputProps={{
              sx: { color: "white" },
              endAdornment: (
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{ ml: 1 }}
                >
                  Send
                </Button>
              ),
            }}
          />
        </form>
      </Paper>
    </Box>
  );
};

export default Chat;
