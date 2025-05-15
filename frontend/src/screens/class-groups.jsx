import React, { useState, useEffect } from "react";
import Navigation from "../components/main_navigation.jsx";
import ClassGroupCard from "../components/ClassGroups/class_group_card.jsx";
import { useNavigate } from "react-router-dom";
import { Container, Box, Button, Grid, Modal } from "@mui/material";
import {
  fetchStudents,
  fetchSubjects,
  fetchClassGroups,
} from "../utils/agent.js";
import ClassWizard from "../components/ClassGroups/class_group_wizard.jsx";
import ClassDetailsDrawer from "../components/ClassGroups/class_group_details_drawer.jsx";
import ActionStatisticsBar from "../components/Dashboard/action_statistics_bar.jsx";
import { useParams } from "react-router-dom";

function Classes() {
  const [showClassForm, setshowClassForm] = useState(false);
  const [classes, setClasses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [currentClassId, setCurrentClassId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [step, setStep] = useState(1);
  const { id } = useParams();
  const navigate = useNavigate();

  const fetchData = async () => {
    const students = await fetchStudents(navigate);
    if (students) setAllStudents(students);
    const subjects = await fetchSubjects(navigate);
    if (subjects) setAllSubjects(subjects);
    const classes = await fetchClassGroups(navigate);
    if (id !== undefined) {
      const classGroup = classes.find((classGroup) => classGroup.id === parseInt(id, 10));
      if (classGroup) {
        setCurrentClassId(classGroup.id);
        setIsDrawerOpen(true);
      }
    }
    setClasses(classes);
  };

  const handleOpenStudentSearch = () => {
    setStep(1);
    setshowClassForm(true);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

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
          actionText="Add New Class"
        />
        <ClassDetailsDrawer
          classGroupId={currentClassId}
          open={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);   
            navigate('/class-groups'); // Remove the ID from the URL
          }}
          handleReloadData={fetchData}
          allStudents={allStudents}
          allSubjects={allSubjects}
          allClasses={classes}
          handleOpenStudentSearch={handleOpenStudentSearch}
        />

        <Grid container spacing={2} className="cards-section">
          {classes.map((data) => (
            <Grid item xs={12} sm={6} md={4} key={data.id}>
              <ClassGroupCard
                data={data}
                onClick={() => handleOpenDrawer(data.id)}
              />
            </Grid>
          ))}
        </Grid>
      </Container>

      <Modal
        open={showClassForm}
        onClose={() => setshowClassForm(false)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            backgroundColor: "#333",
            padding: 4,
            borderRadius: 2,
            boxShadow: 24,
            width: "900px",
            maxWidth: "90%",
            color: "white",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ClassWizard
            currentClassId={currentClassId}
            allStudents={allStudents}
            allSubjects={allSubjects}
            classes={classes}
            handleClose={() => setshowClassForm(false)}
            fetchData={fetchData}
            step={step}
            setStep={setStep}
          />
        </Box>
      </Modal>
    </>
  );
}

export default Classes;
