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
  Modal,
} from "@mui/material";
import Chat from "../components/chat";

function Students() {
  const [showStudentForm, setshowStudentForm] = useState(false);
  const [students, setStudents] = useState([]);
  const [chats, setChats] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [studentName, setStudentName] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [email, setEmail] = useState("");

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
        throw new Error("Failed to fetch students");
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

  const handleSelectChat = (chatId, username) => {
    setChatId(chatId);
    setChatOpen(true);
    setStudentName(username);
  };

  useEffect(() => {
    fetchStudents();
    fetchChats();
  }, []);

  // Function to handle form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setshowStudentForm(false);

    const url = "http://localhost:8000/new-student/";
    const payload = { email };
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
        <Button
          variant="contained"
          color="primary"
          onClick={() => setshowStudentForm(true)}
          sx={{ mb: 4 }}
        >
          Add New Student
        </Button>

        <Grid container spacing={2} className="cards-section">
          {students.map((student) => {
            const chat = chats.find((chat) =>
              chat.participants.includes(student.id)
            );
            const chatId = chat ? chat.id : null;

            return (
              <Grid item xs={12} sm={6} md={4} key={student.id}>
                <StudentInfoCard
                  student={student}
                  chatId={chatId}
                  handleSelectChat={handleSelectChat}
                />
              </Grid>
            );
          })}
        </Grid>
      </Container>

      <Modal
        open={showStudentForm}
        onClose={() => setshowStudentForm(false)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          component="form"
          onSubmit={handleFormSubmit}
          sx={{
            backgroundColor: "white",
            padding: 4,
            borderRadius: 2,
            boxShadow: 24,
            width: "400px",
            maxWidth: "90%",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Add New Student
          </Typography>
          <TextField
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            sx={{ mb: 2 }}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Send Invitation
          </Button>
        </Box>
      </Modal>

      {chatOpen && (
        <Chat
          studentName={studentName}
          currentUserId={currentUserId}
          chatId={chatId}
          chatOpen={chatOpen}
          setChatOpen={setChatOpen}
        />
      )}
    </>
  );
}

export default Students;
