import { useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Box, Typography, Chip } from "@mui/material";
import * as yup from "yup";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { WizardShell } from "../wizard";
import { FieldText, FieldDate, FieldNumber, TagField } from "../fields";
import StudentPicker from "../Students/StudentPicker";
import Dropzone from "../Resources/dropzone";
import { handleCreateAssignment } from "../../utils/agent";

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
});

const DETAIL_FIELDS = ["title", "description", "set_date", "due_date", "max_score"];

const AddAssignmentWizard = ({
  open,
  onClose,
  onCreated,
  students,
  classGroups,
}) => {
  const {
    handleSubmit,
    control,
    trigger,
    reset,
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      due_date: dayjs().add(7, "day"),
      set_date: dayjs(),
      tags: [],
      title: "",
      max_score: 100,
      description: "",
    },
  });

  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setDateValue = useWatch({ control, name: "set_date" });

  const handleFileDrop = (files) =>
    setSelectedFiles((prev) => [...prev, ...files]);
  const handleRemoveFile = (file) =>
    setSelectedFiles((prev) => prev.filter((f) => f !== file));

  const resetAll = () => {
    reset();
    setSelectedStudents([]);
    setSelectedFiles([]);
  };

  const handleFinalSubmit = async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const assignmentData = {
        title: data.title,
        description: data.description,
        set_date: data.set_date ? dayjs(data.set_date).format("YYYY-MM-DD") : null,
        due_date: data.due_date ? dayjs(data.due_date).format("YYYY-MM-DD") : null,
        tags: data.tags,
        max_score: data.max_score,
        students: selectedStudents,
        files: selectedFiles,
      };
      const result = await handleCreateAssignment(assignmentData);
      if (result.ok) {
        toast.success("Assignment created successfully!");
        onCreated?.();
        resetAll();
        onClose?.();
      } else {
        toast.error(result.error || "Failed to create assignment.");
      }
    } catch (error) {
      console.error("Error submitting assignment:", error);
      toast.error("An error occurred while creating the assignment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    {
      label: "Details",
      content: (
        <Box>
          <Controller
            name="title"
            control={control}
            render={({ field, fieldState }) => (
              <FieldText
                {...field}
                label="Title"
                required
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <TagField
                label="Tags (subject, topic…)"
                value={field.value}
                onChange={field.onChange}
                hint="Optional — type to create a new tag or pick an existing one"
              />
            )}
          />
          <Controller
            name="description"
            control={control}
            render={({ field, fieldState }) => (
              <FieldText
                {...field}
                label="Task description"
                multiline
                minRows={2}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="set_date"
            control={control}
            render={({ field, fieldState }) => (
              <FieldDate
                {...field}
                label="Start date"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="due_date"
            control={control}
            render={({ field, fieldState }) => (
              <FieldDate
                {...field}
                label="Due date"
                minDate={setDateValue || dayjs()}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="max_score"
            control={control}
            render={({ field, fieldState }) => (
              <FieldNumber
                {...field}
                label="Max score"
                min={1}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Box>
      ),
    },
    {
      label: "Students",
      content: (
        <StudentPicker
          students={students || []}
          classGroups={classGroups || []}
          selectedStudents={selectedStudents}
          setSelectedStudents={setSelectedStudents}
        />
      ),
    },
    {
      label: "Files",
      content: (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Add files (optional)
          </Typography>
          <Dropzone onDrop={handleFileDrop} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2 }}>
            {selectedFiles.map((file, index) => (
              <Chip
                key={index}
                label={file.name}
                onDelete={() => handleRemoveFile(file)}
                sx={{ justifyContent: "space-between" }}
              />
            ))}
          </Box>
        </Box>
      ),
    },
  ];

  return (
    <WizardShell
      open={open}
      onClose={onClose}
      title="Create new assignment"
      steps={steps}
      submitting={isSubmitting}
      submitLabel="Create assignment"
      onNext={(step) => (step === 0 ? trigger(DETAIL_FIELDS) : true)}
      onSubmit={handleSubmit(handleFinalSubmit)}
    />
  );
};

export default AddAssignmentWizard;
