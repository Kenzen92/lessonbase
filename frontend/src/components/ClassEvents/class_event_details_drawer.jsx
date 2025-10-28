import React, { useState, useEffect } from "react";
import { Box, List, Typography, Drawer, Chip } from "@mui/material";
import StudentListCard from "../Students/student_list_card";
import ClassResources from "../Resources/class_resources";
import { getSubjectIcon } from "../../utils/icons";
import { PrimaryButton, WarningButton } from "../../styles/buttons";
import { useAuth } from "../../contexts/auth_context";

export default function ClassEventDetailsDrawer({
  open,
  handleClose,
  currentClassEvent,
  onClose,
  handleReloadData,
  handleOpenStudentSearch,
  handleCancelClassEvent,
}) {
  const { auth } = useAuth();
  const eventDate = new Date(currentClassEvent?.start_time);
  const formattedDate = `${eventDate.getDate()}/${
    eventDate.getMonth() + 1
  }/${eventDate.getFullYear()}`;
  // Ensure assignmentDetails is available before trying to get the icon
  const IconComponent =
    currentClassEvent?.subject?.name &&
    getSubjectIcon(currentClassEvent.subject.name);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ backdropFilter: "blur(2px)" }}
    >
      <Box
        sx={{ width: 500, p: 3, height: "100%", backgroundColor: "#252525" }}
      >
        {currentClassEvent && (
          <>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "100%",
              }}
            >
              <Box>
                <Chip
                  icon={<IconComponent color="#fff" size={20} />}
                  label={currentClassEvent.subject.name}
                  sx={{
                    color: "#fff",
                    fontSize: "smaller",
                    mt: "auto",
                    mb: "auto",
                    height: "2.2rem",
                    minWidth: "10rem",
                    backgroundColor: currentClassEvent.subject.color,
                  }}
                />
                <Typography variant="h5" sx={{ color: "white", mb: 2 }}>
                  {formattedDate}
                </Typography>
                <Typography variant="h6" sx={{ color: "white", mb: 2 }}>
                  {currentClassEvent.name}
                </Typography>
                <List>
                  {currentClassEvent.students.map((student) => (
                    <StudentListCard
                      key={student.id}
                      student={student}
                      action={"navigate"}
                    />
                  ))}
                </List>
                <ClassResources
                  classId={currentClassEvent?.id}
                  existing_resources={currentClassEvent?.resources}
                  handleReloadData={handleReloadData}
                />
              </Box>
              {auth.userType == "teacher" && (
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <PrimaryButton onClick={handleOpenStudentSearch}>
                    Edit Event
                  </PrimaryButton>
                  <WarningButton onClick={handleCancelClassEvent}>
                    Cancel Class
                  </WarningButton>
                </Box>
              )}
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
}
