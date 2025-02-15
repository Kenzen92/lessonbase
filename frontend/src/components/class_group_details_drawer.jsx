import React from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

export default function ClassDetailsDrawer({
  class_group,
  open,
  onClose,
  handleReloadData,
}) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 300, p: 3 }}>
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
            <ul>
              {class_group.students.map((student) => (
                <li key={student.id}>{student.name}</li>
              ))}
            </ul>
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
