import React, { useState } from "react";
import { Box, Typography, Modal } from "@mui/material";
import AddAssignmentWizard from "./add_assignment_wizard.jsx";

function AddAssignmentModal({
  isOpen,
  setIsOpen,
  students,
  classGroups,
  subjects,
}) {
  const [step, setStep] = useState(1);

  return (
    <>
      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        aria-labelledby="create-assignment-modal"
        aria-describedby="form-to-create-assignment"
        sx={{ display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 2,  }}
      >
        <Box
          sx={{
            bgcolor: "#333",
            padding: 4,
            borderRadius: 2,
            boxShadow: 24,
            width: { xs: "90%", sm: "70%", md: "50%", lg: "30%" },
            color: "#fff",
          }}
        >
          
          <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}>
            Create New Assignment
          </Typography>
          <AddAssignmentWizard
            step={step}
            setStep={setStep}
            students={students}
            subjects={subjects}
            classGroups={classGroups}
            setIsOpen={setIsOpen}
          />
        </Box>
      </Modal>
    </>
  );
}

export default AddAssignmentModal;
