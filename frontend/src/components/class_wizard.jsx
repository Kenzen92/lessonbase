import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  FormControl,
  Select,
} from "@mui/material";
import StudentSearch from "./student_search";
import inputStyle from "../styles/input";

const ClassWizard = ({ allSubjects, allStudents, classes, handleClose }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    class_name: "",
    class_description: "",
    class_subject: "",
    class_code: "",
  });
  const [selectedStudents, setSelectedStudents] = useState([]);

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Submit form logic here
  };

  return (
    <Box sx={{ p: 3, borderRadius: 2, border: 2, color: "#fff" }}>
      {step === 1 && (
        <form>
          <TextField
            fullWidth
            label="Class Name"
            variant="outlined"
            value={formData.class_name}
            onChange={(e) =>
              setFormData({ ...formData, class_name: e.target.value })
            }
            sx={{ mb: 2, ...inputStyle }}
          />
          <TextField
            fullWidth
            label="Class Description"
            variant="outlined"
            value={formData.class_description}
            onChange={(e) =>
              setFormData({ ...formData, class_description: e.target.value })
            }
            sx={{ mb: 2, ...inputStyle }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Select
              value={formData.class_subject}
              onChange={(e) =>
                setFormData({ ...formData, class_subject: e.target.value })
              }
              displayEmpty
              sx={{ ...inputStyle }}
            >
              <MenuItem value="" disabled>
                Select Subject
              </MenuItem>
              {allSubjects.map((subject) => (
                <MenuItem key={subject.id} value={subject.id}>
                  {subject.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Code"
            variant="outlined"
            value={formData.class_code}
            onChange={(e) =>
              setFormData({ ...formData, class_code: e.target.value })
            }
            sx={{ mb: 2, ...inputStyle }}
          />
          <Box
            sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}
          >
            <Button
              variant="outlined"
              color="primary"
              onClick={handleClose}
              sx={{ width: "100%" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              sx={{ width: "100%" }}
            >
              Next
            </Button>
          </Box>
        </form>
      )}
      {step === 2 && (
        <Box>
          <StudentSearch
            students={allStudents}
            classGroups={classes}
            selectedStudents={selectedStudents}
            setSelectedStudents={setSelectedStudents}
          />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: 2,
              gap: 2,
            }}
          >
            <Button
              variant="outlined"
              color="primary"
              onClick={handleBack}
              sx={{ width: "100%" }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              sx={{ width: "100%" }}
            >
              Submit
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ClassWizard;
