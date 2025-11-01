import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import StudentSearch from "../Students/student_search";
import inputStyle from "../../styles/input";
import {
  handleCreateClassGroup,
  handleUpdateClassGroup,
} from "../../utils/agent";
import { toast } from "react-toastify";

const validationSchema = yup.object().shape({
  name: yup.string().required("Class name is required"),
  subjects: yup.array().min(1, "At least one subject is required"),
  class_code: yup.string().required("Class code is required"),
  description: yup.string().optional(),
  color: yup.string().optional(),
});

const ClassWizard = ({
  allSubjects,
  allStudents,
  classes,
  handleClose,
  fetchData,
  step,
  setStep,
  currentClassId,
}) => {
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Find current class data if editing
  const currentClass = currentClassId
    ? classes.find((cls) => cls.id === currentClassId)
    : null;
  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: currentClass?.name || "",
      description: currentClass?.description || "",
      subjects: currentClass?.subjects.map((subject) => subject.id) || [],
      class_code: currentClass?.class_code || "",
      color: currentClass?.color || "#1976D2",
    },
  });

  // Populate form when currentClassId changes
  useEffect(() => {
    if (currentClass) {
      setValue("name", currentClass.name);
      setValue("description", currentClass.description);
      console.log("setting value", currentClass.subjects);
      setValue(
        "subjects",
        currentClass.subjects.map((subject) => subject.id)
      );
      setValue("class_code", currentClass.class_code);
      setValue("color", currentClass.color || "#1976D2");
      setSelectedStudents(currentClass.students || []);
    }
  }, [currentClass, setValue]);

  const handleNext = (data) => {
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const onSubmit = async (data) => {
    data["students"] = selectedStudents;
    try {
      const response = currentClassId
        ? await handleUpdateClassGroup(data, currentClassId)
        : await handleCreateClassGroup(data);
      toast.success(
        currentClassId
          ? "Class group updated successfully!"
          : "Class group created successfully!"
      );
      handleClose();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save class group. Please try again.");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {step === 1 && (
        <form onSubmit={handleSubmit(handleNext)}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Class Name"
                variant="outlined"
                error={!!errors.name}
                helperText={errors.name?.message}
                sx={{ mb: 2, ...inputStyle }}
              />
            )}
          />

          <Controller
            name="description"
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

          <Controller
            name="subjects"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel id="subjects-select-label" sx={{ color: "#fff" }}>
                  Subjects
                </InputLabel>
                <Select
                  {...field}
                  id="subjects"
                  labelId="subjects-select-label"
                  multiple
                  displayEmpty
                  label="Subjects"
                  sx={{
                    mb: 2,
                    color: "white",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#fff",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#fff",
                    },
                    "& .MuiSelect-icon": { color: "#fff" },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: "#333",
                        color: "#fff",
                      },
                    },
                  }}
                >
                  {allSubjects.map((subject) => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.subjects && (
                  <Typography color="error" variant="body2">
                    {errors.subjects.message}
                  </Typography>
                )}
              </FormControl>
            )}
          />

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

          <Controller
            name="color"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel id="color-select-label" sx={{ color: "#fff" }}>
                  Group Color
                </InputLabel>
                <Select
                  {...field}
                  id="color"
                  labelId="color-select-label"
                  label="Group Color"
                  sx={{
                    mb: 2,
                    color: "white",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#fff",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#fff",
                    },
                    "& .MuiSelect-icon": { color: "#fff" },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: "#333",
                        color: "#fff",
                      },
                    },
                  }}
                >
                  <MenuItem value="#1976D2">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          bgcolor: "#1976D2",
                          borderRadius: 1,
                          border: "1px solid #fff",
                        }}
                      />
                      Blue
                    </Box>
                  </MenuItem>
                  <MenuItem value="#388E3C">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          bgcolor: "#388E3C",
                          borderRadius: 1,
                          border: "1px solid #fff",
                        }}
                      />
                      Green
                    </Box>
                  </MenuItem>
                  <MenuItem value="#7B1FA2">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          bgcolor: "#7B1FA2",
                          borderRadius: 1,
                          border: "1px solid #fff",
                        }}
                      />
                      Purple
                    </Box>
                  </MenuItem>
                  <MenuItem value="#D32F2F">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          bgcolor: "#D32F2F",
                          borderRadius: 1,
                          border: "1px solid #fff",
                        }}
                      />
                      Red
                    </Box>
                  </MenuItem>
                  <MenuItem value="#F57C00">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          bgcolor: "#F57C00",
                          borderRadius: 1,
                          border: "1px solid #fff",
                        }}
                      />
                      Orange
                    </Box>
                  </MenuItem>
                  <MenuItem value="#0097A7">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          bgcolor: "#0097A7",
                          borderRadius: 1,
                          border: "1px solid #fff",
                        }}
                      />
                      Cyan
                    </Box>
                  </MenuItem>
                  <MenuItem value="#C2185B">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          bgcolor: "#C2185B",
                          borderRadius: 1,
                          border: "1px solid #fff",
                        }}
                      />
                      Pink
                    </Box>
                  </MenuItem>
                  <MenuItem value="#5D4037">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          bgcolor: "#5D4037",
                          borderRadius: 1,
                          border: "1px solid #fff",
                        }}
                      />
                      Brown
                    </Box>
                  </MenuItem>
                  <MenuItem value="#455A64">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          bgcolor: "#455A64",
                          borderRadius: 1,
                          border: "1px solid #fff",
                        }}
                      />
                      Blue Grey
                    </Box>
                  </MenuItem>
                  <MenuItem value="#FBC02D">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          bgcolor: "#FBC02D",
                          borderRadius: 1,
                          border: "1px solid #fff",
                        }}
                      />
                      Yellow
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            )}
          />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              mt: 2,
            }}
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
              {currentClassId ? "Update" : "Submit"}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ClassWizard;
