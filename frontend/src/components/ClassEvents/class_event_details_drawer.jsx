import { useState } from "react";
import { Box } from "@mui/material";

import StudentListCard from "../Students/student_list_card";
import ResourcePicker from "../Resources/ResourcePicker";
import ClassFeedbackSummary from "./class_feedback_summary";
import { tagList } from "../../utils/tags";
import { useAuth } from "../../contexts/auth_context";
import {
  LumiDrawer,
  PrimaryActionButton,
  SubjectChip,
  DrawerSection,
  DrawerStats,
  DrawerList,
  DangerButton,
  ConfirmDeleteModal,
  lumi,
} from "../luminous";

export default function ClassEventDetailsDrawer({
  open,
  currentClassEvent,
  onClose,
  handleReloadData,
  handleOpenStudentSearch,
  handleCancelClassEvent,
}) {
  const { auth } = useAuth();
  const isTeacher = auth.userType === "teacher";
  const tags = tagList(currentClassEvent);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const isPastEvent = currentClassEvent
    ? new Date(currentClassEvent.start_time) < new Date()
    : false;

  const eventDate = currentClassEvent ? new Date(currentClassEvent.start_time) : null;
  const subtitle = eventDate
    ? `${eventDate.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })} · ${eventDate.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`
    : undefined;

  const footer = isTeacher ? (
    <>
      <PrimaryActionButton label="Edit Event" icon="edit" onClick={handleOpenStudentSearch} sx={{ flex: 1 }} />
      {isPastEvent ? (
        <DangerButton label="Delete" onClick={() => setDeleteConfirmOpen(true)} sx={{ flex: 1 }} />
      ) : (
        <DangerButton label="Cancel Class" onClick={handleCancelClassEvent} sx={{ flex: 1 }} />
      )}
    </>
  ) : null;

  return (
    <>
      <LumiDrawer
        open={open}
        onClose={onClose}
        title={currentClassEvent?.name}
        subtitle={subtitle}
        footer={footer}
      >
        {currentClassEvent && (
          <>
            {tags.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2.5 }}>
                {tags.map((tag) => (
                  <SubjectChip key={tag.id ?? tag.name} label={tag.name} color={tag.color} />
                ))}
              </Box>
            )}

            <DrawerStats
              items={[
                {
                  icon: "group",
                  value: currentClassEvent.students?.length || 0,
                  label: "Students Enrolled",
                  accent: lumi.color.primary,
                },
              ]}
            />

            <DrawerList
              icon="group"
              title="Students"
              items={currentClassEvent.students || []}
              emptyMessage="No students enrolled"
              renderItem={(student) => <StudentListCard key={student.id} student={student} />}
            />

            <DrawerSection icon="folder_open" title="Class Resources">
              <ResourcePicker
                context={{ type: "class-event", id: currentClassEvent?.id }}
                mode={isTeacher ? "teacher" : "student"}
                value={currentClassEvent?.resources ?? []}
                onChange={handleReloadData}
              />
            </DrawerSection>

            {isTeacher && isPastEvent && (
              <DrawerSection icon="event" iconColor={lumi.color.amber} title="Session Feedback">
                <ClassFeedbackSummary classEventId={currentClassEvent.id} />
              </DrawerSection>
            )}
          </>
        )}
      </LumiDrawer>

      <ConfirmDeleteModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          setDeleteConfirmOpen(false);
          handleCancelClassEvent();
        }}
        title="Delete past class?"
        cancelLabel="Keep it"
      >
        This will permanently delete <strong>{currentClassEvent?.name}</strong> and its attendance
        record. This cannot be undone.
      </ConfirmDeleteModal>
    </>
  );
}
