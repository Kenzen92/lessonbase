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
import { fetchChats } from "../utils/agent";
import StudentDetailsDrawer from "../components/Students/student_details_drawer";
import { useNavigate, useParams } from "react-router-dom";
import ActionStatisticsBar from "../components/Dashboard/action_statistics_bar";
import StudentListSearch from "../components/Students/student_list_search";
import { useStudents } from "../contexts/students_context";
import { useUser } from "../contexts/user_context";
import { FaSpinner } from "react-icons/fa";
const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

function Students() {
  const { user, isLoading, isError, refetch } = useUser();
  const {
    data: studentsData,
    isLoading: studentsLoading,
    refetch: refetchStudents,
  } = useStudents();

  const { id } = useParams();
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [chats, setChats] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [email, setEmail] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  // Sync filtered students when context updates
  useEffect(() => {
    if (!studentsData) return;
    setFilteredStudents(studentsData);

    // Auto-open student if URL has ID
    if (id) {
      const intId = parseInt(id, 10);
      const student = studentsData.find((s) => s.id === intId);
      if (student) {
        setCurrentStudent(student);
        setDrawerOpen(true);
      }
    }
  }, [studentsData, id]);

  // Fetch chats separately (still dependent on user)
  useEffect(() => {
    if (!user?.id) return;

    const fetchChatsData = async () => {
      const chatData = await fetchChats();
      const processedChats = chatData.map((chat) => ({
        ...chat,
        participants: chat.participants.filter((p) => p !== user.id),
      }));
      setChats(processedChats);
    };

    fetchChatsData();
  }, [user]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setShowStudentForm(false);

    const url = `${BASE_URL}/new-student/`;
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
          actionFunction={setShowStudentForm}
          actionText="Add New Student"
        />

        <StudentDetailsDrawer
          open={drawerOpen}
          setOpen={setDrawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            navigate("/students");
          }}
          student={currentStudent}
          setChatOpen={setChatOpen}
          setChatId={setChatId}
          setDrawerOpen={setDrawerOpen}
          chats={chats}
        />

        <StudentListSearch
          allStudents={studentsData || []}
          setFilteredStudents={setFilteredStudents}
        />
        {studentsLoading ? (
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <FaSpinner color="#00b0ff" />
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              {filteredStudents.map((student) => (
                <Grid size={12} key={student.id}>
                  <StudentInfoCard
                    student={student}
                    setCurrentStudent={setCurrentStudent}
                    setDrawerOpen={setDrawerOpen}
                    chats={chats}
                    setChatOpen={setChatOpen}
                    setChatId={setChatId}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <Modal
          open={showStudentForm}
          onClose={() => setShowStudentForm(false)}
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
