import React from "react";
import { Box, List, Typography, Button } from "@mui/material";

import StudentListCard from "../Students/student_list_card";
import ResourcePicker from "../Resources/ResourcePicker";
import ClassFeedbackSummary from "./class_feedback_summary";
import { primaryTag } from "../../utils/tags";
import { useAuth } from "../../contexts/auth_context";
import {
  LumiDrawer,
  PrimaryActionButton,
  SubjectChip,
  LumiIcon,
  lumi,
  lumiType,
  tint,
} from "../luminous";

// Token-styled "section card" used throughout the drawer body.
const sectionSx = {
  backgroundColor: lumi.color.surfaceContainer,
  border: `1px solid ${lumi.color.hairline}`,
  borderRadius: lumi.radius.card,
  p: 2.5,
  mb: 2.5,
};

function SectionTitle({ icon, iconColor, children }) {
  return (
    <Typography
      sx={{ ...lumiType.headlineMd, fontSize: "16px", color: lumi.color.onBackground, mb: 2, display: "flex", alignItems: "center", gap: 1 }}
    >
      <LumiIcon name={icon} sx={{ fontSize: 20, color: iconColor || lumi.color.primary }} />
      {children}
    </Typography>
  );
}

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
  const primary = primaryTag(currentClassEvent);

  const eventDate = new Date(currentClassEvent?.start_time);
  const formattedDate = eventDate.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = eventDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const footer = isTeacher ? (
    <>
      <PrimaryActionButton label="Edit Event" icon="edit" onClick={handleOpenStudentSearch} sx={{ flex: 1 }} />
      <Button
        onClick={handleCancelClassEvent}
        sx={{
          flex: 1,
          ...lumiType.buttonText,
          borderRadius: lumi.radius.md,
          color: lumi.color.error,
          border: `1px solid ${tint(lumi.color.error, 0.4)}`,
          "&:hover": { backgroundColor: tint(lumi.color.error, 0.1) },
        }}
      >
        Cancel Class
      </Button>
    </>
  ) : null;

  return (
    <LumiDrawer
      open={open}
      onClose={onClose}
      title={currentClassEvent?.name}
      subtitle={currentClassEvent ? `${formattedDate} · ${formattedTime}` : undefined}
      footer={footer}
    >
      {currentClassEvent && (
        <>
          {primary && (
            <Box sx={{ mb: 2.5 }}>
              <SubjectChip label={primary.name} color={primary.color} />
            </Box>
          )}

          {/* Enrolled count */}
          <Box
            sx={{
              ...sectionSx,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              backgroundColor: tint(lumi.color.primary, 0.1),
              border: `1px solid ${tint(lumi.color.primary, 0.3)}`,
            }}
          >
            <LumiIcon name="group" sx={{ fontSize: 26, color: lumi.color.primary }} />
            <Box sx={{ textAlign: "center" }}>
              <Typography sx={{ ...lumiType.headlineLg, fontSize: "24px", color: lumi.color.primary }}>
                {currentClassEvent.students?.length || 0}
              </Typography>
              <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant }}>
                Students Enrolled
              </Typography>
            </Box>
          </Box>

          {/* Students */}
          <Box sx={sectionSx}>
            <SectionTitle icon="group">Students</SectionTitle>
            {currentClassEvent.students?.length > 0 ? (
              <List sx={{ p: 0 }}>
                {currentClassEvent.students.map((student) => (
                  <Box key={student.id} sx={{ mb: 1 }}>
                    <StudentListCard student={student} action={"navigate"} />
                  </Box>
                ))}
              </List>
            ) : (
              <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant, fontStyle: "italic" }}>
                No students enrolled
              </Typography>
            )}
          </Box>

          {/* Resources */}
          <Box sx={sectionSx}>
            <SectionTitle icon="folder_open">Class Resources</SectionTitle>
            <ResourcePicker
              context={{ type: "class-event", id: currentClassEvent?.id }}
              mode={isTeacher ? "teacher" : "student"}
              value={currentClassEvent?.resources ?? []}
              onChange={handleReloadData}
            />
          </Box>

          {/* Session feedback — teachers, past classes */}
          {isTeacher && currentClassEvent.previous && (
            <Box sx={sectionSx}>
              <SectionTitle icon="event" iconColor={lumi.color.amber}>
                Session Feedback
              </SectionTitle>
              <ClassFeedbackSummary classEventId={currentClassEvent.id} />
            </Box>
          )}
        </>
      )}
    </LumiDrawer>
  );
}
