import React, { useState, useEffect } from "react";
import { Box, List, Divider, Typography, Button, Drawer } from "@mui/material";
import StudentListCard from "./student_list_card";
import { fetchClassGroup } from "../utils/agent";
import { toast } from "react-toastify";
import ClassResources from "./class_resources";

export default function ClassEventDetailsDrawer({
  open,
  handleClose,
  currentClassEvent,
  onClose,
  handleReloadData,
  handleOpenStudentSearch,
  handleCancelClassEvent,
}) {
  const eventDate = new Date(currentClassEvent?.start_time);
  const formattedDate = `${eventDate.getDate()}/${
    eventDate.getMonth() + 1
  }/${eventDate.getFullYear()}`;
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
            <Typography variant="h5" sx={{ color: "white", mb: 2 }}>
              {currentClassEvent.subject.name}
            </Typography>
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
                  action={"chat"}
                />
              ))}
            </List>

            <ClassResources
              classId={currentClassEvent?.id}
              existing_resources={currentClassEvent?.resources}
              handleReloadData={handleReloadData}
            />
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2, width: "100%" }}
              onClick={handleOpenStudentSearch}
            >
              Edit Event
            </Button>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2, width: 100, ml: 2 }}
              onClick={handleCancelClassEvent}
            >
              Cancel Class
            </Button>
          </>
        )}
      </Box>
    </Drawer>
  );
}
