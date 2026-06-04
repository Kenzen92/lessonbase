import { useState } from "react";
import { Box, MenuItem } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import { WizardShell } from "../wizard";
import { FieldText, FieldSelect } from "../fields";
import StudentPicker from "../Students/StudentPicker";
import {
  handleCreateClassGroup,
  handleUpdateClassGroup,
} from "../../utils/agent";

// Data-driven palette replaces the previous ~120 lines of duplicated MenuItem
// swatch markup (B10). Mirrors the backend ClassGroup.COLOR_CHOICES.
const GROUP_COLORS = [
  { value: "#1976D2", label: "Blue" },
  { value: "#388E3C", label: "Green" },
  { value: "#7B1FA2", label: "Purple" },
  { value: "#D32F2F", label: "Red" },
  { value: "#F57C00", label: "Orange" },
  { value: "#0097A7", label: "Cyan" },
  { value: "#C2185B", label: "Pink" },
  { value: "#5D4037", label: "Brown" },
  { value: "#455A64", label: "Blue Grey" },
  { value: "#FBC02D", label: "Yellow" },
];

const validationSchema = yup.object().shape({
  name: yup.string().required("Class name is required"),
  subjects: yup.array().min(1, "At least one subject is required"),
  class_code: yup.string().required("Class code is required"),
  description: yup.string().optional(),
  color: yup.string().optional(),
});

const DETAIL_FIELDS = ["name", "subjects", "class_code"];

const toStudentIds = (value) =>
  (value || []).map((s) => (typeof s === "object" ? s.id : s));

const ClassWizard = ({
  open,
  onClose,
  onSaved,
  currentClassId,
  allSubjects,
  allStudents,
  classes,
}) => {
  const currentClass = currentClassId
    ? classes?.find((cls) => cls.id === currentClassId)
    : null;

  const {
    handleSubmit,
    control,
    trigger,
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: currentClass?.name || "",
      description: currentClass?.description || "",
      subjects: currentClass?.subjects?.map((s) => s.id) || [],
      class_code: currentClass?.class_code || "",
      color: currentClass?.color || "#1976D2",
    },
  });

  const [selectedStudents, setSelectedStudents] = useState(
    toStudentIds(currentClass?.students)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subjectNameById = new Map((allSubjects || []).map((s) => [s.id, s.name]));

  const handleFinalSubmit = async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const payload = { ...data, students: selectedStudents };
    try {
      const result = currentClassId
        ? await handleUpdateClassGroup(payload, currentClassId)
        : await handleCreateClassGroup(payload);
      if (result.ok) {
        toast.success(
          currentClassId
            ? "Class group updated successfully!"
            : "Class group created successfully!"
        );
        onSaved?.();
        onClose?.();
      } else {
        toast.error(result.error || "Failed to save class group. Please try again.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save class group. Please try again.");
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
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <FieldText
                {...field}
                label="Class name"
                required
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="description"
            control={control}
            render={({ field, fieldState }) => (
              <FieldText
                {...field}
                label="Description"
                multiline
                minRows={2}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="subjects"
            control={control}
            render={({ field, fieldState }) => (
              <FieldSelect
                {...field}
                label="Subjects"
                required
                options={(allSubjects || []).map((s) => ({ value: s.id, label: s.name }))}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                SelectProps={{
                  multiple: true,
                  renderValue: (selected) =>
                    selected.map((id) => subjectNameById.get(id) || id).join(", "),
                }}
              />
            )}
          />
          <Controller
            name="class_code"
            control={control}
            render={({ field, fieldState }) => (
              <FieldText
                {...field}
                label="Code"
                required
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="color"
            control={control}
            render={({ field, fieldState }) => (
              <FieldSelect
                {...field}
                label="Group colour"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              >
                {GROUP_COLORS.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 18,
                          height: 18,
                          borderRadius: 0.5,
                          backgroundColor: c.value,
                        }}
                      />
                      {c.label}
                    </Box>
                  </MenuItem>
                ))}
              </FieldSelect>
            )}
          />
        </Box>
      ),
    },
    {
      label: "Students",
      content: (
        <StudentPicker
          students={allStudents || []}
          classGroups={classes || []}
          selectedStudents={selectedStudents}
          setSelectedStudents={setSelectedStudents}
        />
      ),
    },
  ];

  return (
    <WizardShell
      open={open}
      onClose={onClose}
      title={currentClassId ? "Edit class group" : "Create class group"}
      steps={steps}
      submitting={isSubmitting}
      submitLabel={currentClassId ? "Save changes" : "Create group"}
      onNext={(step) => (step === 0 ? trigger(DETAIL_FIELDS) : true)}
      onSubmit={handleSubmit(handleFinalSubmit)}
    />
  );
};

export default ClassWizard;
