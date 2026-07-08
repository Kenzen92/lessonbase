import { useState, useEffect, useMemo } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

import { AppShell, PageHeader, EmptyState, lumi } from "../components/luminous";
import TeacherRow from "../components/People/teacher_row";
import TeacherDetailsDrawer from "../components/People/teacher_details_drawer";
import Chat from "../components/Chat/chat";
import { fetchChats, fetchTeachers } from "../utils/agent";
import useAuthQuery from "../hooks/useAuthQuery";
import { useUser } from "../contexts/user_context";
import { useStatistics } from "../contexts/statistics_context";
import { useClassGroups } from "../contexts/class_groups_context";
import { resolveMediaUrl } from "../utils/media";

/**
 * Student-facing directory: the teachers this student belongs to, with a
 * chat as the headline action. Mirrors the teacher's Students page layout
 * (search in the TopBar, PersonRow list, details drawer) — but read-only:
 * no invites, no Create New.
 */
function Teachers() {
  const { user, firstName, profilePicture } = useUser();
  const { statistics } = useStatistics();
  const { data: classGroups } = useClassGroups();
  const { data: teachersData, isLoading: teachersLoading } = useAuthQuery(
    ["teachers"],
    fetchTeachers,
    { staleTime: 1000 * 60 * 10, retry: 1 }
  );

  const { id } = useParams();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [chats, setChats] = useState([]);
  const [chatsLoaded, setChatsLoaded] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Deep-link: open a teacher's drawer when the URL carries an id.
  useEffect(() => {
    if (!teachersData || !id) return;
    const teacher = teachersData.find((entry) => String(entry.id) === String(id));
    if (teacher) {
      setCurrentTeacher(teacher);
      setDrawerOpen(true);
    }
  }, [teachersData, id]);

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

  // Name/subject substring filter, driven by the shell's TopBar search.
  const filteredTeachers = useMemo(() => {
    const list = teachersData || [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return list;
    return list.filter((t) =>
      [
        `${t.first_name || ""} ${t.last_name || ""}`,
        t.first_name || "",
        t.last_name || "",
        ...(t.subjects || []).map((s) => s.name || ""),
      ].some((field) => field.toLowerCase().includes(q))
    );
  }, [teachersData, searchTerm]);

  const stats = useMemo(() => {
    if (!statistics) return [];
    return [
      { id: "teachers", icon: "group", value: statistics.total_teachers, label: "Teachers" },
      { id: "classes", icon: "school", value: statistics.total_class_groups, label: "Class Groups" },
    ].filter((s) => s.value !== undefined && s.value !== null);
  }, [statistics]);

  // Groups this student shares with the drawer's teacher, for its
  // "Your Classes Together" section.
  const sharedGroups = useMemo(() => {
    if (!currentTeacher) return [];
    return (classGroups || []).filter((group) =>
      (group.teachers || []).some((t) => t.id === currentTeacher.id)
    );
  }, [classGroups, currentTeacher]);

  const openChatWith = (teacher) => {
    setCurrentTeacher(teacher);
    const chat = chats.find((c) => c.participants.includes(teacher.id));
    if (chat) {
      setChatId(chat.id);
      setChatOpen(true);
      return;
    }
    // No chat yet — the details drawer owns chat creation.
    setDrawerOpen(true);
  };

  return (
    <AppShell
      activeNav="teachers"
      user={{ userName: firstName, avatarUrl: resolveMediaUrl(profilePicture) }}
      search={{
        placeholder: "Search teacher…",
        value: searchTerm,
        onChange: setSearchTerm,
      }}
    >
      <PageHeader
        title="My Teachers"
        subtitle="Your teachers, their subjects, and a direct line to each of them."
        stats={stats}
      />

      {teachersLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: lumi.color.primary }} />
        </Box>
      ) : filteredTeachers.length === 0 ? (
        searchTerm ? (
          <Typography sx={{ color: lumi.color.onSurfaceVariant, textAlign: "center", py: 6 }}>
            No teachers match your search.
          </Typography>
        ) : (
          <EmptyState
            icon="group"
            message="No teachers yet. You'll see your teachers here once they add you to a class."
          />
        )
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {filteredTeachers.map((teacher) => (
            <TeacherRow
              key={teacher.id}
              teacher={teacher}
              onChat={() => openChatWith(teacher)}
              onDetails={() => {
                setCurrentTeacher(teacher);
                setDrawerOpen(true);
                navigate(`/teachers/${teacher.id}`);
              }}
            />
          ))}
        </Box>
      )}

      <TeacherDetailsDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          navigate("/teachers");
        }}
        teacher={currentTeacher}
        chats={chats}
        chatsLoaded={chatsLoaded}
        sharedGroups={sharedGroups}
        onOpenChat={(id) => {
          setChatId(id);
          setDrawerOpen(false);
          setChatOpen(true);
        }}
      />

      {chatOpen && (
        <Chat
          student={currentTeacher}
          chatId={chatId}
          chatOpen={chatOpen}
          setChatOpen={setChatOpen}
          currentUserId={user?.id}
        />
      )}
    </AppShell>
  );
}

export default Teachers;
