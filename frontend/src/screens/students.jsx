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
import { PrimaryButton } from "../styles/buttons";
import ActionStatisticsBar from "../components/Dashboard/action_statistics_bar";
import StudentListSearch from "../components/Students/student_list_search";

function Students() {
  const { id } = useParams();
  const [showStudentForm, setshowStudentForm] = useState(false);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [chats, setChats] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [email, setEmail] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);



  useEffect(() => {
    const fetchData = async () => {
      const studentData = await fetchStudents();
      setStudents(studentData);
      setFilteredStudents(studentData);
      setCurrentUserId(window.sessionStorage.getItem("user").id);
      const chatData = await fetchChats();
      const processedChats = chatData.map((chat) => {
        return {
          ...chat,
          participants: chat.participants.filter((id) => id !== currentUserId),
        };
      });
      setChats(processedChats);
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
