import { useState, useEffect, useMemo } from "react";
import { Box, Typography, Button, Avatar } from "@mui/material";
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
  StatusPill,
  DrawerSection,
  DrawerStats,
  DrawerProgress,
  DrawerInfoRow,
  DrawerEmptyText,
  DangerButton,
  ConfirmDeleteModal,
  lumi,
  lumiType,
  tint,
} from "../luminous";

const formatEventTime = (t) =>
  !t
    ? "N/A"
    : new Date(t).toLocaleString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

const formatEnrollmentDate = (dateString) => {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  return Number.isNaN(d.getTime())
    ? dateString
    : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
};

function ScheduleCard({ kind, event, onView }) {
  const isNext = kind === "next";
  return (
    <Box
      sx={{
        p: 1.5,
        mb: isNext ? 0 : 1.5,
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
        <Typography noWrap sx={{ ...lumiType.bodyMd, fontWeight: 600, color: lumi.color.onSurface }}>
          <Box
            component="span"
            sx={{ ...lumiType.labelMd, color: isNext ? lumi.color.primary : lumi.color.onSurfaceVariant, mr: 1 }}
          >
            {isNext ? "NEXT" : "PREVIOUS"}
          </Box>
          {event.name || primaryTag(event)?.name || "Class"}
        </Typography>
        <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant, mt: 0.25 }}>
          {event.start_time}
        </Typography>
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
  chats,
  chatsLoaded,
  onOpenChat,
}) {
  const navigate = useNavigate();
  const [previousClass, setPreviousClass] = useState(null);
  const [nextClass, setNextClass] = useState(null);
  const [classStats, setClassStats] = useState({ totalClasses: 0, completedClasses: 0, upcomingClasses: 0 });
  const [error, setError] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const existingChatId = useMemo(() => {
    if (!student) return null;
    const chat = (chats || []).find((c) => c.participants.includes(student.id));
    return chat ? chat.id : null;
  }, [student, chats]);

  const handleNavigateToClass = (classId) => navigate(`/dashboard/${classId}`);

  const handleChatAction = async () => {
    try {
      if (existingChatId) {
        onOpenChat(existingChatId);
        return;
      }
      if (!student?.id) throw new Error("Student details not available to create chat.");
      const data = await createChat(student.id, navigate);
      if (!data?.id) throw new Error("Failed to create chat");
      onOpenChat(data.id);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const deleteStudent = async () => {
    setDeleteConfirmOpen(false);
    try {
      if (!student?.id) throw new Error("Student details not available to delete.");
      await handleDeleteStudent(student.id, navigate);
      toast.success("Student deleted successfully");
      onClose();
      refetchStudents();
    } catch (e) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setError(null);
      try {
        const data = await fetchClassEventsForStudent(student.id, navigate);
        if (cancelled) return;
        const now = new Date();
        const past = data.filter((e) => new Date(e.start_time) < now);
        const future = data.filter((e) => new Date(e.start_time) >= now);
        setClassStats({ totalClasses: data.length, completedClasses: past.length, upcomingClasses: future.length });
        past.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
        future.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        setPreviousClass(past[0] ? { ...past[0], start_time: formatEventTime(past[0].start_time) } : null);
        setNextClass(future[0] ? { ...future[0], start_time: formatEventTime(future[0].start_time) } : null);
      } catch (e) {
        if (cancelled) return;
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
    return () => {
      cancelled = true;
    };
  }, [student, navigate]);

  const completionPct =
    classStats.totalClasses > 0 ? Math.round((classStats.completedClasses / classStats.totalClasses) * 100) : 0;

  const chatLabel = existingChatId ? "Open Chat" : chatsLoaded ? "Create Chat" : "Loading Chat...";
  const footer = student ? (
    <>
      <PrimaryActionButton
        data-testid="student-drawer-chat-action"
        icon="chat"
        label={chatLabel}
        disabled={!existingChatId && !chatsLoaded}
        onClick={handleChatAction}
        sx={{ flex: 1 }}
      />
      <DangerButton label="Delete Student" onClick={() => setDeleteConfirmOpen(true)} sx={{ flex: 1 }} />
    </>
  ) : null;

  return (
    <>
      <LumiDrawer
        open={open}
        onClose={onClose}
        title={student ? `${student.first_name} ${student.last_name}` : undefined}
        subtitle={student?.email || undefined}
        leading={
          student ? (
            <Avatar
              src={resolveMediaUrl(student.profile_picture) || undefined}
              alt={student.first_name}
              sx={{ width: 44, height: 44, border: `2px solid ${tint(lumi.color.primary, 0.4)}`, bgcolor: lumi.color.surfaceVariant }}
            >
              {student.first_name ? student.first_name[0].toUpperCase() : "?"}
            </Avatar>
          ) : undefined
        }
        footer={footer}
      >
        {student ? (
          <>
            <DrawerStats
              items={[
                { icon: "school", value: classStats.totalClasses, label: "Total", accent: lumi.color.primary },
                { icon: "event", value: classStats.completedClasses, label: "Completed", accent: lumi.color.tertiary },
                { icon: "pending", value: classStats.upcomingClasses, label: "Upcoming", accent: lumi.color.amber },
              ]}
            />

            {classStats.totalClasses > 0 && (
              <DrawerProgress label="Class Progress" value={completionPct} />
            )}

            <DrawerSection icon="person" title="General Information">
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <DrawerInfoRow label="Student ID">#{student.id}</DrawerInfoRow>
                <DrawerInfoRow label="Enrollment Date">{formatEnrollmentDate(student.enrollment_date)}</DrawerInfoRow>
                <DrawerInfoRow label="Account Status">
                  <StatusPill
                    label={student.is_confirmed ? "Confirmed" : "Pending Confirmation"}
                    accent={student.is_confirmed ? "tertiary" : "amber"}
                  />
                </DrawerInfoRow>
              </Box>
            </DrawerSection>

            <DrawerSection icon="event" title="Class Schedule">
              {error ? (
                <Typography sx={{ color: lumi.color.error }}>{error}</Typography>
              ) : (
                <>
                  {previousClass ? (
                    <ScheduleCard kind="previous" event={previousClass} onView={handleNavigateToClass} />
                  ) : (
                    <Box sx={{ mb: 2 }}>
                      <DrawerEmptyText>No previous class found</DrawerEmptyText>
                    </Box>
                  )}
                  {nextClass ? (
                    <ScheduleCard kind="next" event={nextClass} onView={handleNavigateToClass} />
                  ) : (
                    <DrawerEmptyText>No upcoming class scheduled</DrawerEmptyText>
                  )}
                </>
              )}
            </DrawerSection>

            <DrawerSection icon="group" title="Class Groups">
              {student.class_groups?.length > 0 ? (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {student.class_groups.map((group) => (
                    <ClassGroupChip key={group.id} classGroup={group} />
                  ))}
                </Box>
              ) : (
                <DrawerEmptyText>Not enrolled in any class groups</DrawerEmptyText>
              )}
            </DrawerSection>
          </>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <Typography sx={{ color: lumi.color.onSurfaceVariant, textAlign: "center" }}>
              No student selected
            </Typography>
          </Box>
        )}
      </LumiDrawer>

      <ConfirmDeleteModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={deleteStudent}
        title="Delete student?"
      >
        This will permanently remove{" "}
        <strong>
          {student?.first_name} {student?.last_name}
        </strong>{" "}
        and their enrollment data. This cannot be undone.
      </ConfirmDeleteModal>
    </>
  );
}
