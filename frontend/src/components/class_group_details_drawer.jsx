import React from "react";
import { Box, List, Divider } from "@mui/material";
import Drawer from "@mui/material/Drawer";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import StudentListCard from "./student_list_card";

const removeStudent = (studentId) => {
  console.log("Removing student with id: ", studentId);
};

export default function ClassDetailsDrawer({
  class_group,
  open,
  onClose,
  handleReloadData,
  students,
  subjects,
}) {
  console.log(class_group);
  console.log(students);
  console.log(subjects);
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
        <Typography variant="h6" gutterBottom>
          Class Details
        </Typography>
        {class_group ? (
          <>
            <Typography variant="subtitle1">
              Name: {class_group.name}
            </Typography>
            <Typography variant="body2">
              Description: {class_group.description}
            </Typography>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              Students:
            </Typography>
            <Box>
              <List>
                {students.map(
                  (student) =>
                    class_group.students.includes(student.id) && (
                      <React.Fragment key={student.id}>
                        <StudentListCard
                          student={student}
                          removeStudent={removeStudent}
                        />
                        <Divider sx={{ backgroundColor: "#555" }} />
                      </React.Fragment>
                    )
                )}
              </List>
            </Box>
          </>
        ) : (
          <Typography>No class selected.</Typography>
        )}
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
          onClick={handleReloadData}
        >
          Refresh Data
        </Button>
      </Box>
    </Drawer>
  );
}
