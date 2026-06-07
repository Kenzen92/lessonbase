import React, { useState, useEffect } from "react";
import { Box, Typography, Button, LinearProgress, Grid } from "@mui/material";
import { toast } from "react-toastify";

import StudentListCard from "../Students/student_list_card";
import StudentAssignmentAttemptCard from "./student_assignment_attempt_card";
import StudentAssignmentAttemptForm from "./student_assignment_attempt_form";
import { fetchAssignment, fetchAssignmentSubmissions } from "../../utils/agent";
import { primaryTag } from "../../utils/tags";
import { getToken } from "../../utils/tokenStorage";
import { useAuth } from "../../contexts/auth_context";
import {
  LumiDrawer,
  LumiModal,
  PrimaryActionButton,
  SubjectChip,
  LumiIcon,
  lumi,
  lumiType,
  tint,
} from "../luminous";

const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

const sectionSx = {
  backgroundColor: lumi.color.surfaceContainer,
  border: `1px solid ${lumi.color.hairline}`,
  borderRadius: lumi.radius.card,
  p: 2.5,
  mb: 2.5,
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  return Number.isNaN(d.getTime())
    ? "N/A"
    : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
};

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
  const [expandedSections, setExpandedSections] = useState({
    needsGrading: true,
    graded: false,
    notSubmitted: false,
  });
  const { auth } = useAuth();

  const fetchAssignmentData = async () => {
    if (!assignment?.id) return;
    try {
      setAssignmentDetails(await fetchAssignment(assignment.id));
    } catch (error) {
      console.error("Error fetching assignment details:", error);
    }
  };

  useEffect(() => {
    if (assignment?.id) fetchAssignmentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment]);

  const handleDeleteAssignment = async () => {
    try {
      const response = await fetch(`${BASE_URL}/assignment/${assignment.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${getToken()}` },
      });
      if (!response.ok) throw new Error("Failed to delete assignment");
      toast.success("Assignment deleted successfully!");
      setDeleteConfirmOpen(false);
      onClose();
    } catch (error) {
      toast.error(error.message);
      setDeleteConfirmOpen(false);
    }
  };

  const handleToggleSection = (section) =>
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));

  const primary = primaryTag(assignmentDetails);
  const isTeacher = auth.userType === "teacher";

  const footer = assignmentDetails && isTeacher ? (
    <>
      <PrimaryActionButton label="Edit Assignment" icon="edit" onClick={onEdit} sx={{ flex: 1 }} />
      <Button
        onClick={() => setDeleteConfirmOpen(true)}
        sx={{
          flex: 1,
          ...lumiType.buttonText,
          borderRadius: lumi.radius.md,
          color: lumi.color.error,
          border: `1px solid ${tint(lumi.color.error, 0.4)}`,
          "&:hover": { backgroundColor: tint(lumi.color.error, 0.1) },
        }}
      >
        Delete
      </Button>
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
        {assignmentDetails ? (
          <>
            {primary && (
              <Box sx={{ mb: 2 }}>
                <SubjectChip label={primary.name} color={primary.color} />
              </Box>
            )}

            {/* Completion progress */}
            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant }}>
                  Completion Progress
                </Typography>
                <Typography sx={{ ...lumiType.labelMd, color: lumi.color.tertiary, fontWeight: 700 }}>
                  {Math.round(assignmentDetails?.progress || 0)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={assignmentDetails?.progress || 0}
                sx={{
                  height: 8,
                  borderRadius: lumi.radius.pill,
                  backgroundColor: lumi.color.surfaceVariant,
                  "& .MuiLinearProgress-bar": { backgroundColor: lumi.color.tertiary, borderRadius: lumi.radius.pill },
                }}
              />
            </Box>

            {/* Description */}
            {assignmentDetails.description && (
              <Box sx={sectionSx}>
                <Typography sx={{ ...lumiType.headlineMd, fontSize: "16px", color: lumi.color.onBackground, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                  <LumiIcon name="assignment" sx={{ fontSize: 20, color: lumi.color.primary }} />
                  Description
                </Typography>
                <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant }}>
                  {assignmentDetails.description}
                </Typography>
              </Box>
            )}

            {isTeacher && (
              <TeacherStudentView
                assignmentDetails={assignmentDetails}
                assignment={assignment}
                setCurrentAssignmentAttempt={setCurrentAssignmentAttempt}
                setFeedbackModalOpen={setFeedbackModalOpen}
                expandedSections={expandedSections}
                handleToggleSection={handleToggleSection}
              />
            )}

            {auth.userType === "student" && <StudentAssignmentAttemptForm assignment={assignment} />}
          </>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <Typography sx={{ color: lumi.color.onSurfaceVariant, textAlign: "center" }}>
              No assignment selected
            </Typography>
          </Box>
        )}
      </LumiDrawer>

      <LumiModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Confirm Deletion"
        maxWidth="xs"
        actions={
          <>
            <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ color: lumi.color.onSurfaceVariant }}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAssignment}
              sx={{
                ...lumiType.buttonText,
                borderRadius: lumi.radius.md,
                px: 2,
                color: lumi.color.onErrorContainer,
                backgroundColor: lumi.color.errorContainer,
                "&:hover": { backgroundColor: lumi.color.errorContainer, filter: "brightness(1.1)" },
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant }}>
          Are you sure you want to delete this assignment? This action cannot be undone.
        </Typography>
      </LumiModal>
    </>
  );
}

// Teacher view — submission stats + grouped student sections.
function TeacherStudentView({
  assignmentDetails,
  assignment,
  setCurrentAssignmentAttempt,
  setFeedbackModalOpen,
  expandedSections,
  handleToggleSection,
}) {
  const [studentAttempts, setStudentAttempts] = useState({});
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(false);

  useEffect(() => {
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
        setStudentAttempts(attempts);
      } catch (error) {
        console.error("Error fetching student submissions:", error);
      } finally {
        setIsLoadingAttempts(false);
      }
    };
    fetchAllAttempts();
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
    { key: "needsGrading", title: "Needs Grading", icon: "pending", accent: lumi.color.amber },
    { key: "graded", title: "Graded", icon: "check_circle", accent: lumi.color.tertiary },
    { key: "notSubmitted", title: "Not Submitted", icon: "close", accent: lumi.color.error },
  ];

  return (
    <>
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {sections.map((s) => (
          <Grid size={4} key={s.key}>
            <StatCard icon={s.icon} value={groupedStudents[s.key].length} label={s.title} accent={s.accent} />
          </Grid>
        ))}
      </Grid>

      {sections.map((s) => (
        <StudentGroupSection
          key={s.key}
          title={s.title}
          icon={s.icon}
          accent={s.accent}
          students={groupedStudents[s.key]}
          assignment={assignment}
          setCurrentAssignmentAttempt={setCurrentAssignmentAttempt}
          setFeedbackModalOpen={setFeedbackModalOpen}
          expanded={expandedSections[s.key]}
          onToggle={() => handleToggleSection(s.key)}
          studentAttempts={studentAttempts}
          isLoadingAttempts={isLoadingAttempts}
        />
      ))}
    </>
  );
}

function StudentGroupSection({
  title,
  icon,
  accent,
  students,
  assignment,
  setCurrentAssignmentAttempt,
  setFeedbackModalOpen,
  expanded,
  onToggle,
  studentAttempts,
  isLoadingAttempts,
}) {
  return (
    <Box sx={{ ...sectionSx, p: 0, overflow: "hidden" }}>
      <Box
        onClick={onToggle}
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          "&:hover": { backgroundColor: lumi.color.surfaceContainerHigh },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <LumiIcon name={icon} sx={{ fontSize: 20, color: accent }} />
          <Typography sx={{ ...lumiType.headlineMd, fontSize: "16px", color: lumi.color.onBackground }}>
            {title}
          </Typography>
          <Box
            component="span"
            sx={{
              ...lumiType.labelMd,
              px: 1,
              py: 0.25,
              borderRadius: lumi.radius.pill,
              backgroundColor: tint(accent, 0.18),
              color: accent,
            }}
          >
            {students.length}
          </Box>
        </Box>
        <LumiIcon
          name="expand_more"
          sx={{
            fontSize: 22,
            color: lumi.color.onSurfaceVariant,
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform .3s",
          }}
        />
      </Box>

      {expanded && (
        <Box sx={{ px: 2, pb: 2 }}>
          {isLoadingAttempts ? (
            <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant, fontStyle: "italic", textAlign: "center", py: 2 }}>
              Loading student submissions…
            </Typography>
          ) : students.length > 0 ? (
            students.map((student, index) => (
              <Box
                key={student.id}
                sx={{
                  backgroundColor: lumi.color.surfaceContainerLow,
                  borderRadius: lumi.radius.md,
                  p: 2,
                  mb: index < students.length - 1 ? 1.5 : 0,
                  border: `1px solid ${lumi.color.hairline}`,
                }}
              >
                <StudentListCard student={student} action={"navigate"} />
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
            ))
          ) : (
            <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant, fontStyle: "italic", textAlign: "center", py: 2 }}>
              No students in this category
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
