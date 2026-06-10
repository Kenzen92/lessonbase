import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box } from "@mui/material";

import { AppShell, PageHeader, FilterBar, KanbanColumn } from "../components/luminous";
import AssignmentCard from "../components/Assignments/assignment_card.jsx";
import AddAssignmentWizard from "../components/Assignments/add_assignment_wizard.jsx";
import AssignmentDetailsDrawer from "../components/Assignments/assignment_details_drawer.jsx";
import AssignmentFeedbackModal from "../components/Assignments/assignment_feedback_modal.jsx";
import { useAuth } from "../contexts/auth_context.jsx";
import { useAssignments } from "../contexts/assignments_context.jsx";
import { useClassGroups } from "../contexts/class_groups_context.jsx";
import { useStudents } from "../contexts/students_context.jsx";
import { useUser } from "../contexts/user_context.jsx";
import { useStatistics } from "../contexts/statistics_context.jsx";
import { resolveMediaUrl } from "../utils/media";

function Assignments() {
  const { auth } = useAuth();
  const isTeacher = auth.userType === "teacher";
  const navigate = useNavigate();
  const { id } = useParams();

  const { firstName, profilePicture } = useUser();
  const { statistics } = useStatistics();
  const { data: assignments, refetch: refetchAssignments } = useAssignments();
  const { data: classGroups } = useClassGroups();
  const { data: allStudents } = useStudents();

  const [isOpen, setIsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [currentAssignmentAttempt, setCurrentAssignmentAttempt] = useState(null);
  const [feedbackModelOpen, setFeedbackModalOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const columns = [
    { name: "To Mark", label: isTeacher ? "To Mark" : "Submitted", accent: "amber", description: "Assignments awaiting grading or feedback." },
    { name: "Set", label: isTeacher ? "Ongoing" : "To Do", accent: "primary", description: "Set assignments that need to be submitted." },
    { name: "Upcoming", label: "Upcoming", accent: "violet", description: "Assignments scheduled to be set in the future." },
    { name: "Complete", label: "Complete", accent: "tertiary", description: "Assignments all students submitted, reviewed and marked." },
  ];

  // Unique tags across every column → FilterBar chips.
  const tagChips = useMemo(() => {
    const byName = new Map();
    Object.values(assignments || {}).forEach((list) =>
      (list || []).forEach((a) =>
        (a.tags || []).forEach((t) => {
          if (!byName.has(t.name)) byName.set(t.name, { id: t.name, label: t.name, color: t.color });
        })
      )
    );
    return [...byName.values()];
  }, [assignments]);

  const toggleTag = (name) =>
    setSelectedTags((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));

  // Combine tag filter (OR) with a title search.
  const filterCards = (list) => {
    const q = searchTerm.trim().toLowerCase();
    return (list || []).filter((a) => {
      const tagOk = selectedTags.length === 0 || (a.tags || []).some((t) => selectedTags.includes(t.name));
      const searchOk = !q || a.title?.toLowerCase().includes(q);
      return tagOk && searchOk;
    });
  };

  const stats = useMemo(() => {
    if (!statistics) return [];
    const items = [];
    if (statistics.total_assignments !== undefined) {
      items.push({ id: "total", icon: "assignment", value: statistics.total_assignments, label: "Total Assignments" });
    }
    if (statistics.total_documents !== undefined) {
      items.push({ id: "files", icon: "file", value: statistics.total_documents, label: "Files" });
    }
    return items;
  }, [statistics]);

  // Deep-link: open a drawer when the URL carries an assignment id.
  useEffect(() => {
    if (id === undefined || !assignments) return;
    const intId = parseInt(id, 10);
    for (const key in assignments) {
      const found = assignments[key].find((a) => a.id === intId);
      if (found) {
        setCurrentAssignment(found);
        setDrawerOpen(true);
        break;
      }
    }
  }, [id, assignments]);

  return (
    <AppShell
      activeNav="assignments"
      user={{ userName: firstName, avatarUrl: resolveMediaUrl(profilePicture) }}
      search={{ placeholder: "Search assignments…", value: searchTerm, onChange: setSearchTerm }}
      onCreateNew={
        isTeacher
          ? () => {
              setEditingAssignment(null);
              setIsOpen(true);
            }
          : undefined
      }
    >
      <PageHeader
        title="Assignments"
        subtitle="Track, set and mark work across your classes."
        stats={stats}
        action={
          isTeacher
            ? {
                label: "Create Assignment",
                icon: "add",
                onClick: () => {
                  setEditingAssignment(null);
                  setIsOpen(true);
                },
              }
            : undefined
        }
      >
        <FilterBar
          chips={tagChips}
          selected={selectedTags}
          onToggle={toggleTag}
          onClear={() => setSelectedTags([])}
          label="Filter by tag"
        />
      </PageHeader>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
          gap: 2,
          alignItems: "start",
        }}
      >
        {columns.map((column) => {
          const cards = filterCards(assignments?.[column.name]);
          return (
            <KanbanColumn
              key={column.name}
              title={column.label}
              accent={column.accent}
              count={cards.length}
              description={column.description}
              empty={`No ${column.label.toLowerCase()} assignments.`}
              emptyIcon="assignment"
            >
              {cards.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  accent={column.accent}
                  setDrawerOpen={setDrawerOpen}
                  setCurrentAssignment={setCurrentAssignment}
                />
              ))}
            </KanbanColumn>
          );
        })}
      </Box>

      <AddAssignmentWizard
        key={editingAssignment?.id ?? "new"}
        open={isOpen}
        onClose={() => {
          setIsOpen(false);
          setEditingAssignment(null);
        }}
        students={allStudents}
        classGroups={classGroups}
        assignment={editingAssignment}
        onCreated={refetchAssignments}
      />

      <AssignmentFeedbackModal
        feedbackModelOpen={feedbackModelOpen}
        setFeedbackModalOpen={setFeedbackModalOpen}
        currentAssignmentAttempt={currentAssignmentAttempt}
        maxAssignmentScore={currentAssignment?.max_score}
        handleReloadData={() => {
          refetchAssignments();
          if (currentAssignment) setCurrentAssignment({ ...currentAssignment });
        }}
      />

      <AssignmentDetailsDrawer
        open={drawerOpen}
        setOpen={setDrawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          navigate("/assignments");
        }}
        assignment={currentAssignment}
        setCurrentAssignmentAttempt={setCurrentAssignmentAttempt}
        setFeedbackModalOpen={setFeedbackModalOpen}
        onEdit={() => {
          setEditingAssignment(currentAssignment);
          setDrawerOpen(false);
          setIsOpen(true);
        }}
        onFeedbackSubmitted={() => {
          if (currentAssignment) setCurrentAssignment({ ...currentAssignment });
        }}
      />
    </AppShell>
  );
}

export default Assignments;
