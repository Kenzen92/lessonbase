import { useEffect, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Button,
  Typography,
  Box,
  TextField,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import * as yup from "yup";
import dayjs from "dayjs"; // Import Dayjs for date manipulation
import inputStyle from "../../styles/input";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import StudentSearch from "../Students/student_search";
import Dropzone from "../Resources/dropzone";
import { toast } from "react-toastify";
import { handleCreateAssignment } from "../../utils/agent";
// Define your validation schema *outside* the component for better performance
const validationSchema = yup.object().shape({
  title: yup.string().required("Title is required"),
  description: yup.string(),
  max_score: yup.number().positive("Score must be greater than 0"),
  due_date: yup
    .date()
    .typeError("Invalid date format")
    .required("Due date is required")
    .min(yup.ref("set_date"), "Due date must be later than start date"),

  set_date: yup
    .date()
    .typeError("Invalid date format")
    .required("Start date is required"),

  subject: yup
    .number("Subject must be a number")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    })
    .nullable()
    .required("Subject is required")
    .positive("Subject must be positive"),
});

const AddAssignmentWizard = ({
  students,
  subjects,
  classGroups,
  handleClose,
  step,
  setStep,
  setIsOpen,
}) => {
  const {
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      // due date 7 days from now by default
      due_date: dayjs(new Date()).add(7, "day"),
      set_date: dayjs(),
      subject: "",
      title: "",
      max_score: 100,
      description: "",
    },
  });

  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const setDateValue = useWatch({
    control, // Pass the control object from useForm
    name: "set_date",
  });

  const handleFileDrop = (files) => {
    setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
  };

  const handleRemoveFile = (fileToRemove) => {
    setSelectedFiles(selectedFiles.filter((file) => file !== fileToRemove));
  };

  const handleNext = () => {
    console.log("handling next");
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  // This function will now receive the validated form data from handleSubmit
  const handleFinalSubmit = async (data) => {
    console.log("students: ", selectedStudents);
    // Format the due_date using dayjs to 'YYYY-MM-DD'
    const formattedDueDate = data.due_date
      ? dayjs(data.due_date).format("YYYY-MM-DD")
      : null;

    const formattedSetDate = data.set_date
      ? dayjs(data.set_date).format("YYYY-MM-DD")
      : null;

    // Combine form data with other state data
    const assignmentData = {
      title: data.title,
      description: data.description,
      // Format the date as needed by your backend API
      set_date: formattedSetDate,
      due_date: formattedDueDate,
      subject: data.subject,
      max_score: data.max_score,
      students: selectedStudents.map((student_id) => student_id), // Assuming you need student IDs
      files: selectedFiles, // You'll likely need to handle file uploads separately or in handleCreateAssignment
    };

    console.log("Assignment data to send:", assignmentData);

    try {
      // Ensure handleCreateAssignment is available
      if (typeof handleCreateAssignment !== "function") {
        console.error("handleCreateAssignment function is not provided.");
        // Handle this error appropriately, e.g., show a user message
        return;
      }

      const result = await handleCreateAssignment(assignmentData);
      console.log("result: ", result);
      if (result.status == 201) {
        toast.success(result.message || "Assignment created successfully!");

        setIsOpen(false); // Close modal on success

        // Reset the form and state variables
        reset(); // Use react-hook-form's reset
        setStep(1);
        setSelectedStudents([]);
        setSelectedFiles([]);
      } else {
        if (toast.error) {
          toast.error(result ? result.message : "Failed to create assignment.");
        } else {
          console.error(
            "Failed to create assignment:",
            result ? result.message : "Unknown error"
          );
        }
      }
    } catch (error) {
      console.error("Error submitting assignment:", error);
      // Assuming toast is available
      if (typeof toast !== "undefined" && toast.error) {
        toast.error("An error occurred while creating the assignment.");
      } else {
        alert("An error occurred while creating the assignment."); // Fallback
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {step === 1 && (
        <Box>
          <form onSubmit={handleSubmit(handleNext)}>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <TextField
                    {...field}
                    fullWidth
                    label="Title"
                    variant="outlined"
                    type="text"
                    error={!!errors.title}
                    sx={{ ...inputStyle }}
                  />
                  <FormHelperText fullwidth sx={{ color: "error.main", mb: 2 }}>
                    {errors.title ? errors.title.message : " "}
                  </FormHelperText>
                </FormControl>
              )}
            />

            <Controller
              name="subject"
              control={control}
              render={(
                { field, fieldState: { error } } // Access error from fieldState
              ) => (
                <FormControl fullWidth error={!!error}>
                  <InputLabel id="subject-select-label" sx={{ color: "#fff" }}>
                    Subject
                  </InputLabel>
                  <Select
                    {...field} // Spread the field properties onto the Select
                    labelId="subject-select-label"
                    id="subject"
                    label="Subject" // Keep the label prop for correct a11y and notch behavior
                    displayEmpty // To show placeholder if no subject is selected
                    sx={{ ...inputStyle }} // Remove margin-bottom from the Select itself
                    error={!!error} // Set error on the Select component for styling
                  >
                    {subjects?.map((subject) => (
                      <MenuItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </MenuItem>
                    ))}
                  </Select>

                  <FormHelperText
                    sx={{
                      minHeight: 2,
                      visibility: error ? "visible" : "hidden",
                      color: error ? "error.main" : "transparent",
                      mb: 2,
                    }}
                  >
                    {error ? error.message : " "}
                  </FormHelperText>
                </FormControl>
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Task Description"
                  variant="outlined"
                  type="text"
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  sx={{ mb: 4, ...inputStyle }}
                />
              )}
            />

            <Controller
              name="set_date"
              control={control}
              render={(
                { field, fieldState: { error } } // Access error here
              ) => (
                <DatePicker
                  label="Start Date"
                  value={field.value} // Important: Bind the value
                  onChange={field.onChange} // Important: Bind the onChange
                  fullWidth
                  sx={{ ...inputStyle, width: "100%", mb: 4 }}
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
              name="due_date"
              control={control}
              render={(
                { field, fieldState: { error } } // Access error here
              ) => (
                <DatePicker
                  label="Due Date"
                  value={field.value} // Important: Bind the value
                  onChange={field.onChange} // Important: Bind the onChange
                  fullWidth
                  minDate={setDateValue || dayjs()}
                  sx={{ ...inputStyle, width: "100%", mb: 4 }}
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
              name="max_score"
              control={control}
              render={(
                { field, fieldState: { error } } // Access error here
              ) => (
                <TextField
                  type="number"
                  label="Max Score"
                  value={field.value} // Important: Bind the value
                  onChange={field.onChange} // Important: Bind the onChange
                  fullWidth
                  sx={{ ...inputStyle, width: "100%", mb: 4 }}
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
                onClick={() => {
                  setIsOpen(false);
                }}
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
        </Box>
      )}
      {step === 2 && (
        <Box>
          <Typography>Step 2</Typography>
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
              onClick={handleNext}
              sx={{ width: "100%" }}
            >
              Next
            </Button>
          </Box>
        </Box>
      )}
      {step === 3 && (
        <Box>
          <form onSubmit={handleSubmit(handleFinalSubmit)}>
            <Typography variant="h6" gutterBottom>
              Add Files (Optional)
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                mt: 2,
                gap: 2,
              }}
            >
              <Dropzone onDrop={handleFileDrop} />
              {selectedFiles.map((file, index) => (
                <Chip
                  key={index}
                  label={file.name}
                  onDelete={() => handleRemoveFile(file)}
                  color="secondary"
                  sx={{
                    margin: "0.5rem",
                    width: "100%",
                    justifyContent: "space-between",
                    color: "secondary",
                  }}
                />
              ))}
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
                  onClick={handleBack}
                  sx={{ width: "100%" }}
                >
                  Back
                </Button>
                <Button
                  type="submit" // This button triggers the final form submission
                  variant="contained"
                  color="primary"
                  sx={{ width: "100%" }}
                >
                  Submit Assignment
                </Button>
              </Box>
            </Box>
          </form>
        </Box>
      )}
    </Box>
  );
};

export default AddAssignmentWizard;
