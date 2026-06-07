import React, { useState, useEffect, useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

import { AppShell, PageHeader, lumi } from "../components/luminous";
import ClassGroupCard from "../components/ClassGroups/class_group_card.jsx";
import ClassWizard from "../components/ClassGroups/class_group_wizard.jsx";
import ClassDetailsDrawer from "../components/ClassGroups/class_group_details_drawer.jsx";
import { useStudents } from "../contexts/students_context.jsx";
import { useSubjects } from "../contexts/subjects_context.jsx";
import { useClassGroups } from "../contexts/class_groups_context.jsx";
import { useUser } from "../contexts/user_context.jsx";
import { useAuth } from "../contexts/auth_context.jsx";
import { useStatistics } from "../contexts/statistics_context.jsx";
import { resolveMediaUrl } from "../utils/media";

function Classes() {
  const [showClassForm, setShowClassForm] = useState(false);
  const [currentClassId, setCurrentClassId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();

  const { firstName, profilePicture } = useUser();
  const { auth } = useAuth();
  const { statistics } = useStatistics();
  const { data: allStudents, refetch: refetchStudents } = useStudents();
  const { data: allSubjects, refetch: refetchSubjects } = useSubjects();
  const { data: classes, refetch: refetchClassGroups } = useClassGroups();

  const isTeacher = auth.userType === "teacher";

  const handleReloadData = async () => {
    await Promise.all([refetchStudents(), refetchSubjects(), refetchClassGroups()]);
  };

  useEffect(() => {
    if (id !== undefined && classes) {
      const classGroup = classes.find((c) => c.id === parseInt(id, 10));
      if (classGroup) {
        setCurrentClassId(classGroup.id);
        setIsDrawerOpen(true);
      }
    }
  }, [id, classes]);

  const handleOpenDrawer = (classGroupId) => {
    setCurrentClassId(classGroupId);
    setIsDrawerOpen(true);
    navigate(`/class-groups/${classGroupId}`);
  };

  const handleEdit = (classGroupId) => {
    setCurrentClassId(classGroupId);
    setShowClassForm(true);
  };

  // Class groups are fully client-side, so the TopBar search filters by name.
  const filteredClasses = useMemo(() => {
    const list = classes || [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        (c.subjects || []).some((s) => s.name?.toLowerCase().includes(q))
    );
  }, [classes, searchTerm]);

  const stats = useMemo(() => {
    if (!statistics) return [];
    const items = [];
    if (statistics.total_class_groups !== undefined) {
      items.push({ id: "groups", icon: "school", value: statistics.total_class_groups, label: "Total Groups" });
    }
    if (statistics.average_students_per_group !== undefined) {
      items.push({
        id: "avg",
        icon: "group",
        value: `~${Math.round(statistics.average_students_per_group)}`,
        label: "Students/Group",
      });
    }
    return items;
  }, [statistics]);

  return (
    <AppShell
      activeNav="classes"
      user={{ userName: firstName, avatarUrl: resolveMediaUrl(profilePicture) }}
      search={{ placeholder: "Search classes…", value: searchTerm, onChange: setSearchTerm }}
      onCreateNew={
        isTeacher
          ? () => {
              setCurrentClassId(null);
              setShowClassForm(true);
            }
          : undefined
      }
    >
      <PageHeader
        title="Classes"
        subtitle="Manage your teaching groups and subjects."
        stats={stats}
        action={
          isTeacher
            ? {
                label: "Create class group",
                icon: "add",
                onClick: () => {
                  setCurrentClassId(null);
                  setShowClassForm(true);
                },
              }
            : undefined
        }
      />

      {filteredClasses.length === 0 ? (
        <Typography sx={{ color: lumi.color.onSurfaceVariant, textAlign: "center", py: 6 }}>
          {searchTerm ? "No classes match your search." : "No class groups yet."}
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
            gap: 3,
          }}
        >
          {filteredClasses.map((data) => (
            <ClassGroupCard
              key={data.id}
              data={data}
              onClick={() => handleOpenDrawer(data.id)}
              menuItems={[
                { label: "View details", icon: "chevron_right", onClick: () => handleOpenDrawer(data.id) },
                isTeacher && { label: "Edit", icon: "edit", onClick: () => handleEdit(data.id) },
              ]}
            />
          ))}
        </Box>
      )}

      <ClassDetailsDrawer
        classGroupId={currentClassId}
        open={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          navigate("/class-groups");
        }}
        handleReloadData={handleReloadData}
        allStudents={allStudents}
        allSubjects={allSubjects}
        allClasses={classes}
        handleOpenStudentSearch={() => setShowClassForm(true)}
      />

      <ClassWizard
        key={currentClassId ?? "new"}
        open={showClassForm}
        onClose={() => setShowClassForm(false)}
        onSaved={handleReloadData}
        currentClassId={currentClassId}
        allStudents={allStudents}
        allSubjects={allSubjects}
        classes={classes}
      />
    </AppShell>
  );
}

export default Classes;
