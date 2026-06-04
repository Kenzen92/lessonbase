import React, { useState, useEffect } from "react";
import Navigation from "../components/main_navigation.jsx";
import ClassGroupCard from "../components/ClassGroups/class_group_card.jsx";
import { useNavigate } from "react-router-dom";
import { Container, Box, Grid } from "@mui/material";
import ClassWizard from "../components/ClassGroups/class_group_wizard.jsx";
import ClassDetailsDrawer from "../components/ClassGroups/class_group_details_drawer.jsx";
import ActionStatisticsBar from "../components/Dashboard/action_statistics_bar.jsx";
import { useParams } from "react-router-dom";
import { useStudents } from "../contexts/students_context.jsx";
import { useSubjects } from "../contexts/subjects_context.jsx";
import { useClassGroups } from "../contexts/class_groups_context.jsx";

function Classes() {
  const [showClassForm, setshowClassForm] = useState(false);
  const [currentClassId, setCurrentClassId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  // Use contexts instead of local state
  const { data: allStudents, refetch: refetchStudents } = useStudents();
  const { data: allSubjects, refetch: refetchSubjects } = useSubjects();
  const { data: classes, refetch: refetchClassGroups } = useClassGroups();

  const handleOpenStudentSearch = () => {
    setshowClassForm(true);
  };

  const handleReloadData = async () => {
    await Promise.all([
      refetchStudents(),
      refetchSubjects(),
      refetchClassGroups(),
    ]);
  };

  useEffect(() => {
    if (id !== undefined && classes) {
      const classGroup = classes.find(
        (classGroup) => classGroup.id === parseInt(id, 10)
      );
      if (classGroup) {
        setCurrentClassId(classGroup.id);
        setIsDrawerOpen(true);
      }
    }
  }, [id, classes]);

  const handleOpenDrawer = async (classGroupId) => {
    setCurrentClassId(classGroupId);
    setIsDrawerOpen(true);
    navigate(`/class-groups/${classGroupId}`); // Push to new URL
  };

  return (
    <>
      <Navigation />

      <Container>
        <ActionStatisticsBar
          page="classes"
          actionFunction={setshowClassForm}
          actionText="Create class group"
        />
        <ClassDetailsDrawer
          classGroupId={currentClassId}
          open={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            navigate("/class-groups"); // Remove the ID from the URL
          }}
          handleReloadData={handleReloadData}
          allStudents={allStudents}
          allSubjects={allSubjects}
          allClasses={classes}
          handleOpenStudentSearch={handleOpenStudentSearch}
        />
        <Box
          sx={{
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            marginTop: 2,
          }}
        >
          <Grid container spacing={2} className="cards-section">
            {classes?.map((data) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={data.id}>
                <ClassGroupCard
                  data={data}
                  onClick={() => handleOpenDrawer(data.id)}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>

      <ClassWizard
        key={currentClassId ?? "new"}
        open={showClassForm}
        onClose={() => setshowClassForm(false)}
        onSaved={handleReloadData}
        currentClassId={currentClassId}
        allStudents={allStudents}
        allSubjects={allSubjects}
        classes={classes}
      />
    </>
  );
}

export default Classes;
