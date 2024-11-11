// Students.js
import React, { useState, useEffect } from "react";
import Navigation from "../components/main_navigation";
import { toast } from "react-toastify";
import StudentInfoCard from "../components/student_info_card";
import {
  Container,
  Box,
  Button,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import Chat from "../components/chat";

function Students() {
  const [showForm, setShowForm] = useState(false);
  const [students, setStudents] = useState([]);
  const [chats, setChats] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const fetchStudents = async () => {
    try {
      const auth = window.sessionStorage.getItem("token");
      const response = await fetch(
        "http://localhost:8000/students-for-teacher",
        {
          method: "GET",
          headers: {
            Authorization: `Token ${auth}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch subjects");
      }

      const data = await response.json();
      setStudents(data);
      setCurrentUserId(window.sessionStorage.getItem("user").id);
    } catch (error) {
      console.error(error.message);
    }
  };

  const fetchChats = async () => {
    try {
      const auth = window.sessionStorage.getItem("token");
      const response = await fetch("http://localhost:8000/chats", {
        method: "GET",
        headers: {
          Authorization: `Token ${auth}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch chats");
      }

      const data = await response.json();
      const processedChats = data.map((chat) => {
        return {
          ...chat,
          participants: chat.participants.filter((id) => id !== currentUserId),
        };
      });
      setChats(processedChats);
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleSelectChat = (chatId) => {
    console.log("selecting chat: ", chatId);
    setChatId(chatId);
    setChatOpen(true);
  }

  useEffect(() => {
    fetchStudents();
    fetchChats();
  }, []);

  // Function to handle form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setShowForm(false);

    const url = "http://localhost:8000/new-student/";
    const payload = {
      email: e.target.email.value,
    };
    const auth = window.sessionStorage.getItem("token");

    try {
      toast.promise(
        fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Token ${auth}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }),
        {
          pending: "Sending email...",
          success: "Email sent successfully!",
          error: "Failed to send email. Please try again later.",
        }
      );
    } catch (error) {
      console.error(error);
      toast.error("Connection error. Please try again later.");
    }
  };

  return (
    <>
      <Navigation />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {showForm ? (
          <Box component="form" onSubmit={handleFormSubmit} sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Add New Student
            </Typography>
            <TextField
              label="Email"
              name="email"
              type="email"
              required
              fullWidth
              sx={{ mb: 2 }}
            />
            <Button type="submit" variant="contained" color="primary">
              Send Invitation
            </Button>
          </Box>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowForm(true)}
            sx={{ mb: 4 }}
          >
            Add New Student
          </Button>
        )}
        <Grid container spacing={2} className="cards-section">
          {students.map((student) => {
            const chat = chats.find((chat) =>
              chat.participants.includes(student.id)
            );
            const chatId = chat ? chat.id : null;

            return (
              <Grid item xs={12} sm={6} md={4} key={student.id}>
                <StudentInfoCard student={student} chatId={chatId} handleSelectChat={handleSelectChat}/>
              </Grid>
            );
          })}
        </Grid>
      </Container>
      {chatOpen && <Chat currentUserId={currentUserId} chatId={chatId} chatOpen={chatOpen} setChatOpen={setChatOpen}/>}
    </>
  );
}

export default Students;
