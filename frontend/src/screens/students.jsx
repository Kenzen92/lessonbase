import React, { useState, useEffect } from "react";
import Navigation from "../components/main_navigation";
import { toast } from "react-toastify";
import StudentInfoCard from "../components/Students/student_info_card";
import {
  Container,
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Modal,
} from "@mui/material";
import Chat from "../components/Chat/chat";
import { fetchStudents, fetchChats } from "../utils/agent";
import StudentDetailsDrawer from "../components/Students/student_details_drawer";
import { useParams } from "react-router-dom";
import ActionStatisticsBar from "../components/Dashboard/action_statistics_bar";
import StudentListSearch from "../components/Students/student_list_search";
import { useUser } from "../contexts/user_context";

function Students() {
  const { userId } = useUser();
  const { id } = useParams();
  const [showStudentForm, setshowStudentForm] = useState(false);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [chats, setChats] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [email, setEmail] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    // Add a check to make sure userId is available before fetching data that depends on it
    if (userId === null) {
      console.log("userId is null, skipping data fetch in Students effect");
      return; // Don't fetch if userId is not yet available
    }

    const fetchData = async () => {
      console.log("Fetching student/chat data for userId:", userId); // Log the userId being used
      const studentData = await fetchStudents();
      setStudents(studentData);
      setFilteredStudents(studentData);

      const chatData = await fetchChats();
      const processedChats = chatData.map((chat) => {
        return {
          ...chat,
          // Now userId should be the value from the context when this runs
          participants: chat.participants.filter((id) => id !== userId),
        };
      });
      setChats(processedChats);

      // The rest of your logic for handling the ID from params
      if (id != undefined) {
        const intId = parseInt(id, 10);
        const currentStudent = studentData.find(
          (student) => student.id === intId
        );
        setCurrentStudent(currentStudent);
        setDrawerOpen(true);
      }
    };

    fetchData();
  }, [userId, id]); // <-- Added userId and id to the dependency array

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
      <Container>
        <ActionStatisticsBar
          page="students"
          actionFunction={setshowStudentForm}
          actionText="Add New Student"
        />

        <StudentDetailsDrawer
          open={drawerOpen}
          setOpen={setDrawerOpen}
          onClose={() => setDrawerOpen(false)}
          student={currentStudent}
          setChatOpen={setChatOpen}
          setChatId={setChatId}
          setDrawerOpen={setDrawerOpen}
          chats={chats}
        />

        <StudentListSearch
          allStudents={students}
          setFilteredStudents={setFilteredStudents}
        />

        <Grid sx={{ mt: 2 }} container spacing={2} className="cards-section">
          {filteredStudents.map((student) => {
            return (
              <Grid item xs={12} sm={6} md={4} key={student.id}>
                <StudentInfoCard
                  student={student}
                  setCurrentStudent={setCurrentStudent}
                  handleOpenDrawer={setDrawerOpen}
                />
              </Grid>
            );
          })}
        </Grid>

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
              backgroundColor: "#333",
              padding: 4,
              borderRadius: 2,
              boxShadow: 24,
              width: { xs: "90%", sm: "70%", md: "50%", lg: "30%" },
              color: "white",
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
            student={currentStudent}
            chatId={chatId}
            chatOpen={chatOpen}
            setChatOpen={setChatOpen}
          />
        )}
      </Container>
    </>
  );
}

export default Students;
