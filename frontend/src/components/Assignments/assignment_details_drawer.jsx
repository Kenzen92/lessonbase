import React from "react";
import { Box, Typography, Button, Drawer } from "@mui/material";

export default function AssignmentDetailsDrawer({
  assignment,
  open,
  onClose,
  onEdit,
}) {
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
        {assignment ? (
          <>
            <Typography
              variant="h6"
              sx={{ color: "white", mb: 2, textAlign: "center" }}
            >
              {assignment.title}
            </Typography>
            <Typography sx={{ color: "white", mb: 2 }}>
              {assignment.description}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2, width: "100%" }}
              onClick={onEdit}
            >
              Edit Assignment
            </Button>
          </>
        ) : (
          <Typography sx={{ color: "white" }}>
            No Assignment selected.
          </Typography>
        )}
      </Box>
    </Drawer>
  );
}
