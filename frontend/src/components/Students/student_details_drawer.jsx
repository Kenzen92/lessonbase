import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Avatar, LinearProgress, Grid } from "@mui/material";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import { primaryTag } from "../../utils/tags";
import {
  fetchClassEventsForStudent,
  handleDeleteStudent,
  createChat,
} from "../../utils/agent";
import ClassGroupChip from "../ClassGroups/class_group_chip";
import { resolveMediaUrl } from "../../utils/media";
import {
  LumiDrawer,
  PrimaryActionButton,
  LumiIcon,
  lumi,
  lumiType,
  tint,
} from "../luminous";

const sectionSx = {
  backgroundColor: lumi.color.surfaceContainer,
  border: `1px solid ${lumi.color.hairline}`,
  borderRadius: lumi.radius.card,
  p: 2.5,
  mb: 2.5,
};

function SectionTitle({ icon, children }) {
  return (
    <Typography
      sx={{ ...lumiType.headlineMd, fontSize: "16px", color: lumi.color.onBackground, mb: 2, display: "flex", alignItems: "center", gap: 1 }}
    >
      <LumiIcon name={icon} sx={{ fontSize: 20, color: lumi.color.primary }} />
      {children}
    </Typography>
  );
}

function StatCard({ icon, value, label, accent }) {
  return (
    <Box
      sx={{
        textAlign: "center",
        p: 2,
        borderRadius: lumi.radius.card,
        backgroundColor: tint(accent, 0.1),
        border: `1px solid ${tint(accent, 0.3)}`,
      }}
    >
      <LumiIcon name={icon} sx={{ fontSize: 22, color: accent }} />
      <Typography sx={{ ...lumiType.headlineLg, fontSize: "22px", color: accent, my: 0.5 }}>{value}</Typography>
      <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant }}>{label}</Typography>
    </Box>
  );
}

function InfoRow({ label, children }) {
  return (
    <Box>
      <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant, display: "block", mb: 0.25 }}>
        {label}
      </Typography>
      <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurface, fontWeight: 600 }}>{children}</Typography>
    </Box>
  );
}

function ScheduleCard({ kind, event, onView }) {
  const isNext = kind === "next";
  return (
    <Box
      sx={{
        p: 2,
        mb: isNext ? 0 : 2,
        borderRadius: lumi.radius.md,
        backgroundColor: isNext ? tint(lumi.color.primary, 0.1) : lumi.color.surfaceContainerLow,
        border: `1px solid ${isNext ? tint(lumi.color.primary, 0.3) : lumi.color.hairline}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 1,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ ...lumiType.labelMd, color: isNext ? lumi.color.primary : lumi.color.onSurfaceVariant }}>
          {isNext ? "Next Class" : "Previous Class"}
        </Typography>
        <Typography sx={{ ...lumiType.bodyMd, fontWeight: 600, color: lumi.color.onSurface, mb: 0.25 }}>
          {event.name || primaryTag(event)?.name || "Class"}
        </Typography>
        <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant }}>{event.start_time}</Typography>
      </Box>
      <Button
        onClick={() => onView(event.id)}
        sx={{
          ...lumiType.buttonText,
          minWidth: 90,
          color: lumi.color.primary,
          border: `1px solid ${tint(lumi.color.primary, 0.4)}`,
          borderRadius: lumi.radius.md,
          "&:hover": { backgroundColor: tint(lumi.color.primary, 0.1) },
        }}
      >
        View Class
      </Button>
    </Box>
  );
}

export default function StudentDetailsDrawer({
  student,
  open,
  onClose,
  refetchStudents,
  setChatId,
  setChatOpen,
  setDrawerOpen,
  chats,
  chatsLoaded,
}) {
  const navigate = useNavigate();
  const [previousClass, setPreviousClass] = useState(null);
  const [nextClass, setNextClass] = useState(null);
  const [chatId, setChatIdState] = useState(null);
  const [classStats, setClassStats] = useState({ totalClasses: 0, completedClasses: 0, upcomingClasses: 0 });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (student) {
      const chat = chats.find((c) => c.participants.includes(student.id));
      setChatIdState(chat ? chat.id : null);
    } else {
      setChatIdState(null);
    }
  }, [student, chats]);

  const handleNavigateToClass = (classId) => navigate(`/dashboard/${classId}`);

  const handleSelectChat = (id) => {
    setChatId(id);
    setDrawerOpen(false);
    setChatOpen(true);
  };

  const handleCreateChat = async () => {
    try {
      if (!student?.id) throw new Error("Student details not available to create chat.");
      const data = await createChat(student.id, navigate);
      if (!data?.id) throw new Error("Failed to create chat");
      handleSelectChat(data.id);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const deleteStudent = async () => {
    try {
      if (!student?.id) throw new Error("Student details not available to delete.");
      await handleDeleteStudent(student.id, navigate);
      toast.success("Student deleted successfully");
      setTimeout(() => {
        onClose();
        refetchStudents();
      }, 100);
    } catch (e) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    const run = async () => {
      setError(null);
      try {
        if (!student?.id) {
          setPreviousClass(null);
          setNextClass(null);
          return;
        }
        const data = await fetchClassEventsForStudent(student.id, navigate);
        const now = new Date();
        const past = data.filter((e) => new Date(e.start_time) < now);
        const future = data.filter((e) => new Date(e.start_time) > now);
        setClassStats({ totalClasses: data.length, completedClasses: past.length, upcomingClasses: future.length });
        past.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
        future.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        const fmt = (t) =>
          !t
            ? "N/A"
            : new Date(t).toLocaleString(undefined, {
                weekday: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });
        setPreviousClass(past[0] ? { ...past[0], start_time: fmt(past[0].start_time) } : null);
        setNextClass(future[0] ? { ...future[0], start_time: fmt(future[0].start_time) } : null);
      } catch (e) {
        console.error("Error fetching class events:", e);
        setError("Failed to load class schedule.");
        setPreviousClass(null);
        setNextClass(null);
      }
    };
    if (student?.id) run();
    else {
      setPreviousClass(null);
      setNextClass(null);
      setError(null);
    }
  }, [student, navigate]);

  const formatEnrollmentDate = (dateString) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    return Number.isNaN(d.getTime())
      ? dateString
      : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  };

  const completionPct =
    classStats.totalClasses > 0 ? Math.round((classStats.completedClasses / classStats.totalClasses) * 100) : 0;
  const confirmAccent = student?.is_confirmed ? lumi.color.tertiary : lumi.color.amber;

  const chatLabel = chatId ? "Open Chat" : chatsLoaded ? "Create Chat" : "Loading Chat...";
  const footer = student ? (
    <>
      <PrimaryActionButton
        data-testid="student-drawer-chat-action"
        icon="chat"
        label={chatLabel}
        disabled={!student || (!chatId && !chatsLoaded)}
        onClick={chatId ? () => handleSelectChat(chatId) : handleCreateChat}
        sx={{ flex: 1 }}
      />
      <Button
        onClick={deleteStudent}
        sx={{
          flex: 1,
          ...lumiType.buttonText,
          borderRadius: lumi.radius.md,
          color: lumi.color.error,
          border: `1px solid ${tint(lumi.color.error, 0.4)}`,
          "&:hover": { backgroundColor: tint(lumi.color.error, 0.1) },
        }}
      >
        Delete Student
      </Button>
    </>
  ) : null;

  return (
    <LumiDrawer
      open={open}
      onClose={onClose}
      title={student ? `${student.first_name} ${student.last_name}` : undefined}
      subtitle={student?.email || undefined}
      footer={footer}
    >
      {student ? (
        <>
          {/* Identity */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <Avatar
              src={resolveMediaUrl(student.profile_picture) || undefined}
              alt={student.first_name}
              sx={{ width: 80, height: 80, border: `3px solid ${tint(lumi.color.primary, 0.4)}`, bgcolor: lumi.color.surfaceVariant }}
            >
              {student.first_name ? student.first_name[0].toUpperCase() : "?"}
            </Avatar>
          </Box>

          {/* Stats */}
          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            <Grid size={4}>
              <StatCard icon="school" value={classStats.totalClasses} label="Total" accent={lumi.color.primary} />
            </Grid>
            <Grid size={4}>
              <StatCard icon="event" value={classStats.completedClasses} label="Completed" accent={lumi.color.tertiary} />
            </Grid>
            <Grid size={4}>
              <StatCard icon="pending" value={classStats.upcomingClasses} label="Upcoming" accent={lumi.color.amber} />
            </Grid>
          </Grid>

          {/* Progress */}
          {classStats.totalClasses > 0 && (
            <Box sx={sectionSx}>
              <Typography sx={{ ...lumiType.bodyMd, fontWeight: 600, color: lumi.color.onSurface, mb: 1 }}>
                Class Progress
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={completionPct}
                  sx={{
                    flex: 1,
                    height: 8,
                    borderRadius: lumi.radius.pill,
                    backgroundColor: lumi.color.surfaceVariant,
                    "& .MuiLinearProgress-bar": { backgroundColor: lumi.color.tertiary, borderRadius: lumi.radius.pill },
                  }}
                />
                <Typography sx={{ ...lumiType.bodyMd, fontWeight: 700, color: lumi.color.tertiary }}>
                  {completionPct}%
                </Typography>
              </Box>
            </Box>
          )}

          {/* General information */}
          <Box sx={sectionSx}>
            <SectionTitle icon="person">General Information</SectionTitle>
            <Grid container spacing={2}>
              <Grid size={6}>
                <InfoRow label="Student ID">#{student.id}</InfoRow>
              </Grid>
              <Grid size={6}>
                <InfoRow label="Enrollment Date">{formatEnrollmentDate(student.enrollment_date)}</InfoRow>
              </Grid>
              <Grid size={12}>
                <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant, display: "block", mb: 0.5 }}>
                  Account Status
                </Typography>
                <Box
                  component="span"
                  sx={{
                    px: 1.25,
                    py: 0.5,
                    borderRadius: lumi.radius.pill,
                    ...lumiType.labelMd,
                    backgroundColor: tint(confirmAccent, 0.18),
                    color: confirmAccent,
                    border: `1px solid ${tint(confirmAccent, 0.5)}`,
                  }}
                >
                  {student.is_confirmed ? "Confirmed" : "Pending Confirmation"}
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Schedule */}
          <Box sx={sectionSx}>
            <SectionTitle icon="event">Class Schedule</SectionTitle>
            {error && <Typography sx={{ color: lumi.color.error, mb: 2 }}>{error}</Typography>}
            {!error && (
              <>
                {previousClass ? (
                  <ScheduleCard kind="previous" event={previousClass} onView={handleNavigateToClass} />
                ) : (
                  <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant, fontStyle: "italic", mb: 2 }}>
                    No previous class found
                  </Typography>
                )}
                {nextClass ? (
                  <ScheduleCard kind="next" event={nextClass} onView={handleNavigateToClass} />
                ) : (
                  <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant, fontStyle: "italic" }}>
                    No upcoming class scheduled
                  </Typography>
                )}
              </>
            )}
          </Box>

          {/* Class groups */}
          <Box sx={sectionSx}>
            <SectionTitle icon="group">Class Groups</SectionTitle>
            {student.class_groups?.length > 0 ? (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {student.class_groups.map((group) => (
                  <ClassGroupChip key={group.id} classGroup={group} />
                ))}
              </Box>
            ) : (
              <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant, fontStyle: "italic" }}>
                Not enrolled in any class groups
              </Typography>
            )}
          </Box>
        </>
      ) : (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
          <Typography sx={{ color: lumi.color.onSurfaceVariant, textAlign: "center" }}>
            No student selected
          </Typography>
        </Box>
      )}
    </LumiDrawer>
  );
}
