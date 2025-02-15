import React, { useState, useEffect } from "react";
import Navigation from "../components/main_navigation";
import ClassGroupCard from "../components/class_group_card";
import { useNavigate } from "react-router-dom";

import { Container, Box, Button, Grid, Modal } from "@mui/material";
import {
  fetchStudents,
  fetchSubjects,
  fetchClassGroups,
} from "../utils/agent.js";
import ClassWizard from "../components/class_wizard.jsx";

function Classes() {
  const [showClassForm, setshowClassForm] = useState(false);
  const [classes, setClasses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const navigate = useNavigate();

  const fetchData = async () => {
    const students = await fetchStudents(navigate);
    if (students) setAllStudents(students);
    const subjects = await fetchSubjects(navigate);
    if (subjects) setAllSubjects(subjects);
    const classes = await fetchClassGroups(navigate);
    if (classes) setClasses(classes);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <Navigation />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setshowClassForm(true)}
          sx={{ mb: 4 }}
        >
          Add New Class
        </Button>

        <Grid container spacing={2} className="cards-section">
          {classes.map((data) => {
            return (
              <Grid item xs={12} sm={6} md={4} key={data.id}>
                <ClassGroupCard data={data} />
              </Grid>
            );
          })}
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
          }}
        >
          <ClassWizard
            allStudents={allStudents}
            allSubjects={allSubjects}
            classes={classes}
            handleClose={() => setshowClassForm(false)}
          />
        </Box>
      </Modal>
    </>
  );
}

export default Classes;
