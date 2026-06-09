import { useMemo, useState } from "react";
import { Alert, Box } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { WizardShell } from "../wizard";
import { FieldText, FieldDate, FieldTime, FieldNumber, TagField } from "../fields";
import StudentPicker from "../Students/StudentPicker";
import {
  handleCreateClassEvent,
  handleUpdateClassEvent,
} from "../../utils/agent";

const validationSchema = yup.object().shape({
  name: yup.string().trim().required("Class name is required"),
  start_date: yup
    .date()
    .typeError("Invalid date format")
    .required("Start date is required"),
  start_time: yup.string().required("Start time is required"),
  duration: yup
    .number()
    .typeError("Duration is required")
    .required("Duration is required")
    .min(10, "Must be at least 10 minutes")
    .max(180, "Must be 180 minutes or less"),
});

const DETAIL_FIELDS = ["name", "start_date", "start_time", "duration"];

// Crockford-style alphabet (no ambiguous O/0, I/1) for a readable, type-able
// code suffix.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// A Jira-ID-style placeholder name (e.g. "CLASS-A7F3") so a new class is never
// nameless. Stateless and frontend-only; the teacher can overwrite it freely.
const generateClassCode = () => {
  let suffix = "";
  for (let i = 0; i < 4; i += 1) {
    suffix += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return `CLASS-${suffix}`;
};

const toStudentIds = (value) =>
  (value || []).map((s) => (typeof s === "object" ? s.id : s));

// Build the form's default values. For a new class the name falls back to a
// generated code; for an edit it uses the saved name (the code arg is ignored).
const buildDefaults = (data, code) => ({
  name: data?.name || code,
  start_date: data?.start_time ? dayjs(data.start_time) : dayjs(),
  start_time: data?.start_time
    ? dayjs(data.start_time).format("HH:mm")
    : dayjs().format("HH:mm"),
  duration: data?.duration || 60,
  tags: data?.tags || [],
});

const PAST_EVENT_HELPER = "Can't edit — this class has already taken place.";

const ClassEventWizard = ({
  open,
  onClose,
  onSaved,
  classData,
  students,
  classGroups,
}) => {
  // Generated once per mount. The wizard is keyed on the class id upstream, so a
  // fresh "new class" mount gets its own code while editing keeps the saved name.
  const generatedName = useMemo(() => generateClassCode(), []);

  const {
    handleSubmit,
    control,
    trigger,
    reset,
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: buildDefaults(classData, generatedName),
  });

  // Derive directly from start_time so this works regardless of whether
  // `previous` is present (list serializer) or absent (detail serializer).
  const isPastEvent = classData ? new Date(classData.start_time) < new Date() : false;

  const [selectedStudents, setSelectedStudents] = useState(
    toStudentIds(classData?.students)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinalSubmit = async (data) => {
    if (isSubmitting) return;

    const datePart = dayjs(data.start_date);
    const timePart = dayjs(data.start_time, "HH:mm");
    if (!datePart.isValid() || !timePart.isValid()) {
      toast.error("Invalid date or time selected.");
      return;
    }
    const combined = datePart.hour(timePart.hour()).minute(timePart.minute());

    const payload = {
      // For past events send the original start_time/duration unchanged so
      // the backend comparison always passes. The form strips seconds (HH:mm
      // only) which would otherwise cause a spurious mismatch.
      start_time: isPastEvent ? classData.start_time : combined.toISOString(),
      duration: isPastEvent ? classData.duration : data.duration,
      students: selectedStudents,
      tags: data.tags,
      name: data.name,
    };

    setIsSubmitting(true);
    try {
      const result = classData
        ? await handleUpdateClassEvent(classData.id, payload)
        : await handleCreateClassEvent(payload);
      if (result.ok) {
        toast.success("The class event was saved successfully");
        onSaved?.();
        // Reset with a fresh code so back-to-back class creations don't reuse
        // the same prefilled name.
        reset(buildDefaults(classData, generateClassCode()));
        onClose?.();
      } else {
        toast.error(result.error || "Failed to save class.");
      }
    } catch (error) {
      console.error("Error:", error.message);
      toast.error("Failed to save class.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    {
      label: "Details",
      content: (
        <Box>
          {isPastEvent && (
            <Alert severity="info" sx={{ mb: 2 }}>
              This class has already taken place. You can update the name, tags,
              and student list, but the date, time, and duration are fixed.
            </Alert>
          )}
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
                hint="Auto-generated — edit to rename"
              />
            )}
          />
          <Controller
            name="start_date"
            control={control}
            render={({ field, fieldState }) => (
              <FieldDate
                {...field}
                label="Date"
                disabled={isPastEvent}
                error={!!fieldState.error}
                helperText={isPastEvent ? PAST_EVENT_HELPER : (fieldState.error?.message || " ")}
              />
            )}
          />
          <Controller
            name="start_time"
            control={control}
            render={({ field, fieldState }) => (
              <FieldTime
                label="Time"
                value={field.value ? dayjs(field.value, "HH:mm") : null}
                onChange={(v) => field.onChange(v ? v.format("HH:mm") : null)}
                inputRef={field.ref}
                disabled={isPastEvent}
                error={!!fieldState.error}
                helperText={isPastEvent ? PAST_EVENT_HELPER : (fieldState.error?.message || " ")}
              />
            )}
          />
          <Controller
            name="duration"
            control={control}
            render={({ field, fieldState }) => (
              <FieldNumber
                {...field}
                label="Duration (minutes)"
                min={10}
                max={180}
                disabled={isPastEvent}
                error={!!fieldState.error}
                helperText={isPastEvent ? PAST_EVENT_HELPER : (fieldState.error?.message || " ")}
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
  ];

  return (
    <WizardShell
      open={open}
      onClose={onClose}
      title={classData ? (isPastEvent ? "Edit past class" : "Edit class") : "Schedule a class"}
      steps={steps}
      submitting={isSubmitting}
      submitLabel={classData ? "Save changes" : "Schedule class"}
      onNext={(step) => (step === 0 ? trigger(DETAIL_FIELDS) : true)}
      onSubmit={handleSubmit(handleFinalSubmit)}
    />
  );
};

export default ClassEventWizard;
