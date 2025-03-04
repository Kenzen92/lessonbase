import React, { useState, useEffect } from "react";
import Navigation from "../components/main_navigation";
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

function Classes() {
  const [showClassForm, setshowClassForm] = useState(false);
  const [classes, setClasses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [currentClassId, setCurrentClassId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const fetchData = async () => {
    const students = await fetchStudents(navigate);
    if (students) setAllStudents(students);
    const subjects = await fetchSubjects(navigate);
    if (subjects) setAllSubjects(subjects);
    const classes = await fetchClassGroups(navigate);
    console.log(classes);
    setClasses(classes);
  };

  const handleOpenStudentSearch = () => {
    console.log("handling it");
    setStep(1);
    setshowClassForm(true);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDrawer = async (classGroupId) => {
    setCurrentClassId(classGroupId);
    setIsDrawerOpen(true);
  };

  return (
    <>
      <Navigation />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <ClassDetailsDrawer
          classGroupId={currentClassId}
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          handleReloadData={fetchData}
          allStudents={allStudents}
          allSubjects={allSubjects}
          allClasses={classes}
          handleOpenStudentSearch={handleOpenStudentSearch}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={() => setshowClassForm(true)}
          sx={{ mb: 4 }}
        >
          Add New Class
        </Button>

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
