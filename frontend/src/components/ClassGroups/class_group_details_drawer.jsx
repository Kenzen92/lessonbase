import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import StudentListCard from "../Students/student_list_card";
import { fetchClassGroup } from "../../utils/agent";
import useRole from "../../hooks/useRole";
import {
  LumiDrawer,
  PrimaryActionButton,
  SubjectChip,
  DrawerSection,
  DrawerStats,
  DrawerInfoRow,
  DrawerEmptyText,
  DrawerList,
  lumi,
} from "../luminous";

export default function ClassDetailsDrawer({ classGroupId, open, onClose, handleOpenStudentSearch }) {
  const [classGroup, setClassGroup] = useState(null);
  const { isTeacher } = useRole();
  const navigate = useNavigate();

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

  return (
    <LumiDrawer
      open={open}
      onClose={onClose}
      title={classGroup?.name}
      subtitle={classGroup ? `Class Code: ${classGroup.class_code}` : undefined}
      footer={
        classGroup && isTeacher ? (
          <PrimaryActionButton label="Edit Class" icon="edit" onClick={handleOpenStudentSearch} sx={{ flex: 1 }} />
        ) : null
      }
    >
      {classGroup ? (
        <>
          <DrawerStats
            items={[
              { icon: "group", value: classGroup.students?.length || 0, label: "Students", accent: lumi.color.primary },
              { icon: "folder_open", value: classGroup.subjects?.length || 0, label: "Subjects", accent: lumi.color.tertiary },
            ]}
          />

          <DrawerSection icon="school" title="Class Information">
            <DrawerInfoRow label="Description">
              {classGroup.description || "No description provided"}
            </DrawerInfoRow>
          </DrawerSection>

          <DrawerSection icon="folder_open" title="Subjects">
            {classGroup.subjects?.length > 0 ? (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {classGroup.subjects.map((subject) => (
                  <SubjectChip key={subject.id} label={subject.name} color={subject.color} />
                ))}
              </Box>
            ) : (
              <DrawerEmptyText>No subjects assigned</DrawerEmptyText>
            )}
          </DrawerSection>

          {/* Students see who teaches the group, linking into their
              Teachers directory. */}
          {!isTeacher && (
            <DrawerList
              icon="person"
              title="Teachers"
              items={classGroup.teachers || []}
              emptyMessage="No teachers assigned"
              renderItem={(teacher) => (
                <StudentListCard
                  key={teacher.id}
                  student={teacher}
                  onClick={() => navigate(`/teachers/${teacher.id}`)}
                />
              )}
            />
          )}

          <DrawerList
            icon="group"
            title={isTeacher ? "Students" : "Classmates"}
            items={classGroup.students || []}
            emptyMessage="No students enrolled"
            renderItem={(student) => (
              // Classmate rows are read-only for students; only teachers
              // may drill into a student's detail page.
              <StudentListCard key={student.id} student={student} onClick={isTeacher ? undefined : null} />
            )}
          />
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
