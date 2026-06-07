import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { Box, Button, TextField, Typography, Modal, CircularProgress } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

import { AppShell, PageHeader, lumi } from "../components/luminous";
import StudentRow from "../components/Students/student_row";
import StudentDetailsDrawer from "../components/Students/student_details_drawer";
import Chat from "../components/Chat/chat";
import { fetchChats } from "../utils/agent";
import { useStudents } from "../contexts/students_context";
import { useUser } from "../contexts/user_context";
import { useAuth } from "../contexts/auth_context";
import { useStatistics } from "../contexts/statistics_context";
import { resolveMediaUrl } from "../utils/media";
import { getToken } from "../utils/tokenStorage";

const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

function Students() {
  const { user, firstName, profilePicture } = useUser();
  const { auth } = useAuth();
  const { statistics } = useStatistics();
  const {
    data: studentsData,
    isLoading: studentsLoading,
    refetch: refetchStudents,
  } = useStudents();

  const { id } = useParams();
  const navigate = useNavigate();
  const isTeacher = auth.userType === "teacher";

  const [showStudentForm, setShowStudentForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [chats, setChats] = useState([]);
  const [chatsLoaded, setChatsLoaded] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [email, setEmail] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Deep-link: open a student's drawer when the URL carries an id.
  useEffect(() => {
    if (!studentsData || !id) return;
    const student = studentsData.find((entry) => String(entry.id) === String(id));
    if (student) {
      setCurrentStudent(student);
      setDrawerOpen(true);
    }
  }, [studentsData, id]);

  // Fetch chats once the user is known.
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setChatsLoaded(false);
      try {
        const chatData = await fetchChats();
        setChats(
          (chatData || []).map((chat) => ({
            ...chat,
            participants: chat.participants.filter((p) => p !== user.id),
          }))
        );
      } finally {
        setChatsLoaded(true);
      }
    })();
  }, [user]);

  // Name/username substring filter, driven by the shell's TopBar search.
  const filteredStudents = useMemo(() => {
    const list = studentsData || [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return list;
    return list.filter((s) =>
      [
        `${s.first_name || ""} ${s.last_name || ""}`,
        s.first_name || "",
        s.last_name || "",
        s.username || "",
      ].some((field) => field.toLowerCase().includes(q))
    );
  }, [studentsData, searchTerm]);

  const stats = useMemo(() => {
    if (!statistics) return [];
    const items = [
      { id: "total", icon: "group", value: statistics.total_students, label: "Total" },
      { id: "active", icon: "person", value: statistics.active_students, label: "Active" },
      { id: "inactive", icon: "person", value: statistics.inactive_students, label: "Inactive" },
    ];
    if (statistics.avg_assignments_per_student !== undefined) {
      items.push({
        id: "avg",
        icon: "assignment",
        value: Number(statistics.avg_assignments_per_student).toFixed(1),
        label: "Avg Assignments",
      });
    }
    return items.filter((s) => s.value !== undefined && s.value !== null);
  }, [statistics]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setShowStudentForm(false);
    try {
      toast.promise(
        fetch(`${BASE_URL}/new-student/`, {
          method: "POST",
          headers: {
            Authorization: `Token ${getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
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
    <AppShell
      activeNav="students"
      user={{ userName: firstName, avatarUrl: resolveMediaUrl(profilePicture) }}
      search={{
        placeholder: "Search student…",
        value: searchTerm,
        onChange: setSearchTerm,
      }}
      onCreateNew={isTeacher ? () => setShowStudentForm(true) : undefined}
    >
      <PageHeader
        title="Students Directory"
        subtitle="Manage your students, their classes and activity."
        stats={stats}
        action={
          isTeacher
            ? { label: "Add New Student", icon: "add", onClick: () => setShowStudentForm(true) }
            : undefined
        }
      />

      {studentsLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: lumi.color.primary }} />
        </Box>
      ) : filteredStudents.length === 0 ? (
        <Typography sx={{ color: lumi.color.onSurfaceVariant, textAlign: "center", py: 6 }}>
          {searchTerm ? "No students match your search." : "No students yet."}
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {filteredStudents.map((student) => (
            <StudentRow
              key={student.id}
              student={student}
              setCurrentStudent={setCurrentStudent}
              setDrawerOpen={setDrawerOpen}
              setChatOpen={setChatOpen}
              setChatId={setChatId}
              chats={chats}
            />
          ))}
        </Box>
      )}

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
        chatsLoaded={chatsLoaded}
        refetchStudents={refetchStudents}
      />

      <Modal
        open={showStudentForm}
        onClose={() => setShowStudentForm(false)}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
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
          currentUserId={user?.id}
        />
      )}
    </AppShell>
  );
}

export default Students;
