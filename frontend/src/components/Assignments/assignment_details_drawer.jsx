import React, { useState, useEffect } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { toast } from "react-toastify";

import StudentListCard from "../Students/student_list_card";
import StudentAssignmentAttemptCard from "./student_assignment_attempt_card";
import StudentAssignmentAttemptForm from "./student_assignment_attempt_form";
import { fetchAssignment, fetchAssignmentSubmissions, deleteAssignment } from "../../utils/agent";
import { primaryTag } from "../../utils/tags";
import { useAuth } from "../../contexts/auth_context";
import {
  LumiDrawer,
  PrimaryActionButton,
  SubjectChip,
  DrawerSection,
  DrawerStats,
  DrawerProgress,
  DrawerList,
  DangerButton,
  ConfirmDeleteModal,
  lumi,
  lumiType,
} from "../luminous";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  return Number.isNaN(d.getTime())
    ? "N/A"
    : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
};

export default function AssignmentDetailsDrawer({
  assignment,
  setCurrentAssignmentAttempt,
  open,
  onClose,
  onEdit,
  setFeedbackModalOpen,
}) {
  const [assignmentDetails, setAssignmentDetails] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { auth } = useAuth();

  useEffect(() => {
    let cancelled = false;
    if (!assignment?.id) {
      setAssignmentDetails(null);
      return undefined;
    }
    (async () => {
      try {
        const data = await fetchAssignment(assignment.id);
        if (!cancelled) setAssignmentDetails(data);
      } catch (error) {
        console.error("Error fetching assignment details:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assignment?.id]);

  const handleDeleteAssignment = async () => {
    const result = await deleteAssignment(assignment.id);
    setDeleteConfirmOpen(false);
    if (result.ok) {
      toast.success("Assignment deleted successfully!");
      onClose();
    } else {
      toast.error(result.error || "Failed to delete assignment");
    }
  };

  const primary = primaryTag(assignmentDetails);
  const isTeacher = auth.userType === "teacher";

  const footer =
    assignmentDetails && isTeacher ? (
      <>
        <PrimaryActionButton label="Edit Assignment" icon="edit" onClick={onEdit} sx={{ flex: 1 }} />
        <DangerButton label="Delete" onClick={() => setDeleteConfirmOpen(true)} sx={{ flex: 1 }} />
      </>
    ) : null;

  return (
    <>
      <LumiDrawer
        open={open}
        onClose={onClose}
        title={assignmentDetails?.title}
        subtitle={
          assignmentDetails
            ? `Set: ${formatDate(assignmentDetails.set_date)} · Due: ${formatDate(assignmentDetails.due_date)}`
            : undefined
        }
        width={540}
        footer={footer}
      >
        {!assignment ? (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <Typography sx={{ color: lumi.color.onSurfaceVariant, textAlign: "center" }}>
              No assignment selected
            </Typography>
          </Box>
        ) : !assignmentDetails ? (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <CircularProgress sx={{ color: lumi.color.primary }} />
          </Box>
        ) : (
          <>
            {primary && (
              <Box sx={{ mb: 2 }}>
                <SubjectChip label={primary.name} color={primary.color} />
              </Box>
            )}

            <DrawerProgress label="Completion Progress" value={assignmentDetails.progress || 0} />

            {assignmentDetails.description && (
              <DrawerSection icon="assignment" title="Description">
                <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant }}>
                  {assignmentDetails.description}
                </Typography>
              </DrawerSection>
            )}

            {isTeacher && (
              <TeacherStudentView
                assignmentDetails={assignmentDetails}
                assignment={assignment}
                setCurrentAssignmentAttempt={setCurrentAssignmentAttempt}
                setFeedbackModalOpen={setFeedbackModalOpen}
              />
            )}

            {auth.userType === "student" && <StudentAssignmentAttemptForm assignment={assignment} />}
          </>
        )}
      </LumiDrawer>

      <ConfirmDeleteModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteAssignment}
        title="Confirm Deletion"
      >
        Are you sure you want to delete this assignment? This action cannot be undone.
      </ConfirmDeleteModal>
    </>
  );
}

// Teacher view — submission stats + grouped student sections.
function TeacherStudentView({
  assignmentDetails,
  assignment,
  setCurrentAssignmentAttempt,
  setFeedbackModalOpen,
}) {
  const [studentAttempts, setStudentAttempts] = useState({});
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchAllAttempts = async () => {
      if (!assignmentDetails?.students?.length) return;
      setIsLoadingAttempts(true);
      const attempts = {};
      try {
        const submissions = await fetchAssignmentSubmissions(assignment.id);
        if (Array.isArray(submissions)) {
          submissions.forEach((sub) => {
            if (sub.student?.id) attempts[sub.student.id] = sub;
          });
        }
        if (!cancelled) setStudentAttempts(attempts);
      } catch (error) {
        console.error("Error fetching student submissions:", error);
      } finally {
        if (!cancelled) setIsLoadingAttempts(false);
      }
    };
    fetchAllAttempts();
    return () => {
      cancelled = true;
    };
  }, [assignmentDetails?.students, assignment.id]);

  const groupedStudents = React.useMemo(() => {
    const groups = { needsGrading: [], graded: [], notSubmitted: [] };
    (assignmentDetails?.students || []).forEach((student) => {
      const attempt = studentAttempts[student.id];
      if (attempt && ["graded", "returned"].includes(attempt.status)) groups.graded.push(student);
      else if (attempt && attempt.status === "submitted") groups.needsGrading.push(student);
      else groups.notSubmitted.push(student);
    });
    return groups;
  }, [assignmentDetails?.students, studentAttempts]);

  const sections = [
    { key: "needsGrading", title: "Needs Grading", icon: "pending", accent: lumi.color.amber, defaultExpanded: true },
    { key: "graded", title: "Graded", icon: "check_circle", accent: lumi.color.tertiary, defaultExpanded: false },
    { key: "notSubmitted", title: "Not Submitted", icon: "close", accent: lumi.color.error, defaultExpanded: false },
  ];

  if (isLoadingAttempts) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={24} sx={{ color: lumi.color.primary }} />
      </Box>
    );
  }

  return (
    <>
      <DrawerStats
        items={sections.map((s) => ({
          icon: s.icon,
          value: groupedStudents[s.key].length,
          label: s.title,
          accent: s.accent,
        }))}
      />

      {sections.map((s) => (
        <DrawerList
          key={s.key}
          icon={s.icon}
          title={s.title}
          accent={s.accent}
          items={groupedStudents[s.key]}
          defaultExpanded={s.defaultExpanded}
          emptyMessage="No students in this category"
          renderItem={(student) => (
            <Box
              key={student.id}
              sx={{
                backgroundColor: lumi.color.surfaceContainerLow,
                borderRadius: lumi.radius.md,
                p: 1.5,
                border: `1px solid ${lumi.color.hairline}`,
              }}
            >
              <StudentListCard student={student} />
              <Box sx={{ mt: 1 }}>
                <StudentAssignmentAttemptCard
                  assignment={assignment}
                  student={student}
                  setCurrentAssignmentAttempt={setCurrentAssignmentAttempt}
                  setFeedbackModalOpen={setFeedbackModalOpen}
                  attemptData={studentAttempts[student.id]}
                />
              </Box>
            </Box>
          )}
        />
      ))}
    </>
  );
}
