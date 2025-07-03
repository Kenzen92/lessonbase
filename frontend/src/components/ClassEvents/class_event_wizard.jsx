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
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import StudentSearch from "../Students/student_search";
import dayjs from "dayjs"; // Import Dayjs for date manipulation
import { toast } from "react-toastify";
import inputStyle from "../../styles/input";
const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL

// Define your validation schema *outside* the component for better performance
const validationSchema = yup.object().shape({
  start_date: yup
    .date()
    .typeError("Invalid date format")
    .required("Start date is required"),
  start_time: yup.string().required("Start time is required"), // Keep as string for TimePicker
  duration: yup
    .number()
    .required("Duration is required")
    .min(10, "Must be more than 10")
    .max(180, "Must be less than 180"),
  subject: yup.string().required("Subject is required"),
});

const ClassEventWizard = ({
  subjects,
  students,
  classData,
  handleClose,
  step,
  setStep,
  classGroups,
  handleReloadData,
}) => {
  const [selectedStudents, setSelectedStudents] = useState([]);
  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      start_date: classData?.start_date ? dayjs(classData.start_date) : dayjs(), // Use Dayjs
      start_time: classData?.start_time || dayjs().format("HH:mm"), // Format as HH:mm for TimePicker
      subject: classData?.subject.id || null,
      duration: classData?.duration || "60",
    },
  });

  // Populate form when classDataId changes
  useEffect(() => {
    if (classData) {
      setValue("subject", classData.subject.id);
      setValue("class_code", classData.class_code);
      setValue("start_date", dayjs(classData.start_date)); // Use Dayjs
      setValue("start_time", classData.start_time);
      setSelectedStudents(classData.students || []);
    }
  }, [classData, setValue]);

  const handleNext = (data) => {
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const onSubmit = async (data) => {
    // Ensure subject is selected correctly
    const selectedSubjectObj = subjects.find(
      (subject) => subject.id === parseInt(data.subject)
    );

    if (!data.start_date || !data.start_time) {
      toast.error("Start date and time are required.");
      return;
    }

    // Parse date and time safely
    const datePart = dayjs(data.start_date);
    const timePart = dayjs(data.start_time, "HH:mm");

    if (!datePart.isValid() || !timePart.isValid()) {
      toast.error("Invalid date or time selected.");
      return;
    }

    // Combine date and time
    const combinedDateTime = datePart
      .hour(timePart.hour())
      .minute(timePart.minute());

    const newClass = {
      start_time: combinedDateTime.toISOString(), // Convert to ISO format
      duration: data.duration,
      students: selectedStudents,
      subject: selectedSubjectObj ? selectedSubjectObj.id : null, // Ensure valid subject ID
    };

    try {
      const auth = window.sessionStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/class-event/`, {
        method: classData ? "PUT" : "POST", // Use PUT for updates, POST for new entries
        headers: {
          Authorization: `Token ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newClass),
      });

      if (!response.ok) {
        throw new Error("Failed to save class event");
      }

      toast.success("The class event was scheduled successfully");
      handleReloadData();
      handleClose();
    } catch (error) {
      console.error("Error:", error.message);
      toast.error("Failed to schedule class.");
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3}}>
        {step === 1 && (
          <form onSubmit={handleSubmit(handleNext)}>
            <Controller
              name="start_date"
              control={control}
              render={(
                { field, fieldState: { error } } // Access error here
              ) => (
                <DatePicker
                  label="Date"
                  value={field.value} // Important: Bind the value
                  onChange={field.onChange} // Important: Bind the onChange
                  fullWidth
                  sx={{ ...inputStyle, width: "100%", mb: 2 }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      error={!!error}
                      helperText={error?.message}
                    />
                  )} // Show error
                />
              )}
            />

            <Controller
              name="start_time"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TimePicker
                  label="Time"
                  value={dayjs(field.value, "HH:mm")}
                  onChange={(newValue) =>
                    field.onChange(newValue ? newValue.format("HH:mm") : null)
                  }
                  fullWidth
                  sx={{ ...inputStyle, width: "100%", mb: 2 }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
              )}
            />

            <Controller
              name="duration"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Duration"
                  variant="outlined"
                  type="number"
                  error={!!errors.class_code}
                  helperText={errors.class_code?.message}
                  sx={{ mb: 2, ...inputStyle }}
                />
              )}
            />

            <Controller
              name="subject"
              control={control}
              rules={{ required: "Subject is required" }} // Add required rule here if not in yup
              render={(
                { field, fieldState: { error } } // Access error from fieldState
              ) => (
                <FormControl fullWidth error={!!error}>
                  {" "}
                  {/* Set error on FormControl */}
                  <InputLabel id="subject-select-label" sx={{ color: "#fff" }}>
                    Subject
                  </InputLabel>
                  <Select
                    {...field} // Spread the field properties onto the Select
                    labelId="subject-select-label"
                    id="subject"
                    label="Subject"
                    displayEmpty // To show placeholder if no subject is selected
                    sx={{ ...inputStyle }}
                    error={!!error} // Set error on the Select component for styling
                  >
                    {subjects?.map((subject) => (
                      <MenuItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {error && ( // Conditionally render error message
                    <Typography color="error" variant="body2">
                      {error.message}
                    </Typography>
                  )}
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
                type="submit" // Important: Keep the type="submit"
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
              students={students}
              classGroups={classGroups}
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
                {classData ? "Update" : "Submit"}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default ClassEventWizard;
