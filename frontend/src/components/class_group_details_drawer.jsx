import React, { useState, useEffect } from "react";
import { Box, List, Divider, Typography, Button, Drawer } from "@mui/material";
import StudentListCard from "./student_list_card";
import { fetchClassGroup } from "../utils/agent";
import { toast } from "react-toastify";

export default function ClassDetailsDrawer({
  classGroupId,
  open,
  onClose,
  handleOpenStudentSearch,
}) {
  const [classGroup, setClassGroup] = useState(null);

  useEffect(() => {
    if (classGroupId) {
      fetchClassGroupData(classGroupId);
    } else {
      setClassGroup(null);
    }
  }, [classGroupId]);

  const fetchClassGroupData = async (id) => {
    const data = await fetchClassGroup(id);
    if (data) {
      setClassGroup(data);
    } else {
      toast.error("Failed to fetch class group data");
    }
  };

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
        {classGroup ? (
          <>
            <Typography variant="h6" sx={{ color: "white", mb: 2 }}>
              {classGroup.name}
            </Typography>
            <Typography variant="body1" sx={{ color: "white", mb: 2 }}>
              <strong>Code:</strong> {classGroup.class_code}
            </Typography>
            <Typography variant="body1" sx={{ color: "white", mb: 2 }}>
              <strong>Description:</strong> {classGroup.description || "N/A"}
            </Typography>
            <Typography variant="body1" sx={{ color: "white", mb: 2 }}>
              <strong>Subjects:</strong>{" "}
              {classGroup.subjects.map((subject) => subject.name).join(", ")}
            </Typography>
            <Divider sx={{ mt: 2, mb: 2 }} />
            <Typography variant="h6" sx={{ color: "white", mb: 2 }}>
              Students
            </Typography>
            <List>
              {classGroup.students.map((student) => (
                <StudentListCard
                  key={student.id}
                  student={student}
                  action={"chat"}
                />
              ))}
            </List>
          </>
        ) : (
          <Typography sx={{ color: "white" }}>No class selected.</Typography>
        )}
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 2, width: "100%" }}
          onClick={handleOpenStudentSearch}
        >
          Edit Class
        </Button>
      </Box>
    </Drawer>
  );
}
