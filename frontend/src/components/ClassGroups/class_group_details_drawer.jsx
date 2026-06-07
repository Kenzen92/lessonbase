import React, { useState, useEffect } from "react";
import { Box, List, Typography, Grid } from "@mui/material";
import { toast } from "react-toastify";

import StudentListCard from "../Students/student_list_card";
import { fetchClassGroup } from "../../utils/agent";
import {
  LumiDrawer,
  PrimaryActionButton,
  SubjectChip,
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
        ...sectionSx,
        mb: 0,
        textAlign: "center",
        backgroundColor: tint(accent, 0.1),
        border: `1px solid ${tint(accent, 0.3)}`,
      }}
    >
      <LumiIcon name={icon} sx={{ fontSize: 24, color: accent }} />
      <Typography sx={{ ...lumiType.headlineLg, fontSize: "24px", color: accent, my: 0.5 }}>{value}</Typography>
      <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant }}>{label}</Typography>
    </Box>
  );
}

function InfoRow({ label, children }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant, display: "block", mb: 0.25 }}>
        {label}
      </Typography>
      <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurface, fontWeight: 600 }}>{children}</Typography>
    </Box>
  );
}

export default function ClassDetailsDrawer({ classGroupId, open, onClose, handleOpenStudentSearch }) {
  const [classGroup, setClassGroup] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (classGroupId) {
      (async () => {
        const data = await fetchClassGroup(classGroupId);
        if (cancelled) return;
        if (data) setClassGroup(data);
        else toast.error("Failed to fetch class group data");
      })();
    } else {
      setClassGroup(null);
    }
    return () => {
      cancelled = true;
    };
  }, [classGroupId]);

  const statusAccentColor = (status) =>
    status === "active" ? lumi.color.tertiary : status === "archived" ? lumi.color.outline : lumi.color.error;

  return (
    <LumiDrawer
      open={open}
      onClose={onClose}
      title={classGroup?.name}
      subtitle={classGroup ? `Class Code: ${classGroup.class_code}` : undefined}
      footer={
        classGroup ? <PrimaryActionButton label="Edit Class" icon="edit" onClick={handleOpenStudentSearch} sx={{ flex: 1 }} /> : null
      }
    >
      {classGroup ? (
        <>
          {/* Quick stats */}
          <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
            <Grid size={6}>
              <StatCard icon="group" value={classGroup.students?.length || 0} label="Students" accent={lumi.color.primary} />
            </Grid>
            <Grid size={6}>
              <StatCard icon="folder_open" value={classGroup.subjects?.length || 0} label="Subjects" accent={lumi.color.tertiary} />
            </Grid>
          </Grid>

          {/* Class information */}
          <Box sx={sectionSx}>
            <SectionTitle icon="school">Class Information</SectionTitle>
            <InfoRow label="Description">{classGroup.description || "No description provided"}</InfoRow>
            {classGroup.location && <InfoRow label="Location">{classGroup.location}</InfoRow>}
            {(classGroup.year || classGroup.term) && (
              <InfoRow label="Academic Period">
                {classGroup.year && `Year ${classGroup.year}`}
                {classGroup.year && classGroup.term && " - "}
                {classGroup.term && classGroup.term}
              </InfoRow>
            )}
            {classGroup.status && (
              <Box sx={{ mt: 0.5 }}>
                <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant, display: "block", mb: 0.5 }}>
                  Status
                </Typography>
                <Box
                  component="span"
                  sx={{
                    px: 1.25,
                    py: 0.5,
                    borderRadius: lumi.radius.pill,
                    ...lumiType.labelMd,
                    backgroundColor: tint(statusAccentColor(classGroup.status), 0.18),
                    color: statusAccentColor(classGroup.status),
                    border: `1px solid ${tint(statusAccentColor(classGroup.status), 0.5)}`,
                  }}
                >
                  {classGroup.status.charAt(0).toUpperCase() + classGroup.status.slice(1)}
                </Box>
              </Box>
            )}
          </Box>

          {/* Subjects */}
          <Box sx={sectionSx}>
            <SectionTitle icon="folder_open">Subjects</SectionTitle>
            {classGroup.subjects?.length > 0 ? (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {classGroup.subjects.map((subject) => (
                  <SubjectChip key={subject.id} label={subject.name} color={subject.color} />
                ))}
              </Box>
            ) : (
              <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant, fontStyle: "italic" }}>
                No subjects assigned
              </Typography>
            )}
          </Box>

          {/* Students */}
          <Box sx={sectionSx}>
            <SectionTitle icon="group">Students</SectionTitle>
            {classGroup.students?.length > 0 ? (
              <List sx={{ p: 0 }}>
                {classGroup.students.map((student) => (
                  <Box key={student.id} sx={{ mb: 1 }}>
                    <StudentListCard student={student} action={"chat"} />
                  </Box>
                ))}
              </List>
            ) : (
              <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant, fontStyle: "italic" }}>
                No students enrolled
              </Typography>
            )}
          </Box>
        </>
      ) : (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
          <Typography sx={{ color: lumi.color.onSurfaceVariant, textAlign: "center" }}>
            No class group selected
          </Typography>
        </Box>
      )}
    </LumiDrawer>
  );
}
