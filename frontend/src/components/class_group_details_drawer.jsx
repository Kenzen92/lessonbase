import React, { useState, useEffect } from "react";
import {
  Box,
  List,
  Divider,
  TextField,
  Button,
  Typography,
  Drawer,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import StudentListCard from "./student_list_card";
import { editClassGroup, fetchClassGroup } from "../utils/agent";
import { toast } from "react-toastify";
import inputStyle from "../styles/input";
import StudentSearch from "./student_search";

const validationSchema = yup.object().shape({
  name: yup.string().required("Class name is required"),
  class_code: yup.string().required("Class name is required"),
  description: yup.string().nullable(),
  subjects: yup.array().min(1, "At least one subject is required"),
  students: yup.array().nullable(),
});

export default function ClassDetailsDrawer({
  classGroupId,
  open,
  onClose,
  handleReloadData,
  allSubjects,
  allStudents,
  allClasses,
}) {
  const [classGroup, setClassGroup] = useState(null);
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
  });

  useEffect(() => {
    if (classGroupId) {
      fetchClassGroupData(classGroupId);
    }
  }, [classGroupId]);

  const fetchClassGroupData = async (id) => {
    const data = await fetchClassGroup(id);
    if (data) {
      setClassGroup(data);
      setValue("name", data.name);
      setValue("class_code", data.class_code);
      setValue("description", data.description || "");
      setValue(
        "subjects",
        data.subjects.map((subject) => subject.id)
      );
      setValue(
        "students",
        data.students.map((student) => student.id)
      );
    } else {
      toast.error("Failed to fetch class group data");
    }
  };

  const setSelectedStudents = (students) => {
    setValue("students", students);
  };

  const onSubmit = async (data) => {
    const updatedClassGroup = { ...classGroup, ...data };
    const response = await editClassGroup(classGroup.id, updatedClassGroup);
    if (response) {
      toast.success("Class group updated successfully");
      handleReloadData();
    } else {
      toast.error("Failed to update class group");
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
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ mt: 4 }}
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Name"
                  fullWidth
                  sx={{ ...inputStyle, mb: 2 }}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  fullWidth
                  sx={{ ...inputStyle, mb: 2 }}
                />
              )}
            />
            <Controller
              name="class_code"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Code"
                  fullWidth
                  sx={{ ...inputStyle, mb: 2 }}
                  error={!!errors.class_code}
                  helperText={errors.class_code?.message}
                />
              )}
            />
            <FormControl fullWidth error={!!errors.subjects}>
              <InputLabel id="subjects-select-label" sx={{ color: "#fff" }}>
                Subjects
              </InputLabel>
              <Controller
                name="subjects"
                control={control}
                render={({ field }) => (
                  <Select
                    id="subjects"
                    labelId="subjects-select-label"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    multiple
                    displayEmpty
                    label="Subjects"
                    sx={{
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
                )}
              />
              {errors.subjects && (
                <Typography color="error">{errors.subjects.message}</Typography>
              )}
              <Divider sx={{ mt: 2, mb: 2 }} />
              <List>
                {watch("students")?.map((studentId) => (
                  <StudentListCard
                    key={studentId}
                    student={studentId}
                    onRemove={() =>
                      field.onChange(
                        field.value.filter((id) => id !== studentId)
                      )
                    }
                  />
                ))}
              </List>
            </FormControl>
            <Divider sx={{ mt: 2, mb: 2 }} />
            <Box>
              <StudentSearch
                students={allStudents}
                classGroups={allClasses}
                selectedStudents={watch("students")}
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
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit(onSubmit)}
                  sx={{ width: "100%" }}
                >
                  Submit
                </Button>
              </Box>
            </Box>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              type="submit"
            >
              Save Changes
            </Button>
          </Box>
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
