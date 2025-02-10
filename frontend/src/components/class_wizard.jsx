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
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import StudentSearch from "./student_search";
import inputStyle from "../styles/input";
import { handleCreateClassGroup } from "../utils/agent";
import { toast } from "react-toastify";

const validationSchema = yup.object().shape({
  class_name: yup.string().required("Class name is required"),
  class_subject: yup.string().required("Class subject is required"),
  class_code: yup.string().required("Class code is required"),
  class_description: yup.string().optional(),
});

const ClassWizard = ({ allSubjects, allStudents, classes, handleClose }) => {
  const [step, setStep] = useState(1);
  const [selectedStudents, setSelectedStudents] = useState([]);

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      class_name: "",
      class_description: "",
      class_subject: "",
      class_code: "",
    },
  });

  const handleNext = (data) => {
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const onSubmit = async (data) => {
    try {
      await handleCreateClassGroup({ ...data, students: selectedStudents });
      toast.success("Class group created successfully!");
    } catch (error) {
      toast.error("Failed to create class group. Please try again.");
    }
  };
  return (
    <Box sx={{ p: 3, borderRadius: 2, border: 2, color: "#fff" }}>
      {step === 1 && (
        <form onSubmit={handleSubmit(handleNext)}>
          <Controller
            name="class_name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Class Name"
                variant="outlined"
                error={!!errors.class_name}
                helperText={errors.class_name?.message}
                sx={{ mb: 2, ...inputStyle }}
              />
            )}
          />

          <Controller
            name="class_description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Class Description"
                variant="outlined"
                sx={{ mb: 2, ...inputStyle }}
              />
            )}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <Controller
              name="class_subject"
              control={control}
              render={({ field }) => (
                <Select {...field} displayEmpty sx={{ ...inputStyle }}>
                  <MenuItem value="" disabled>
                    Select Subject
                  </MenuItem>
                  {allSubjects.map((subject) => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            {errors.class_subject && (
              <Typography color="error" variant="caption">
                {errors.class_subject.message}
              </Typography>
            )}
          </FormControl>

          <Controller
            name="class_code"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Code"
                variant="outlined"
                error={!!errors.class_code}
                helperText={errors.class_code?.message}
                sx={{ mb: 2, ...inputStyle }}
              />
            )}
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
              type="submit"
              variant="contained"
              color="primary"
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
              onClick={handleSubmit(onSubmit)}
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
