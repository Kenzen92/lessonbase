import { useState } from "react";
import { Box } from "@mui/material";
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
  name: yup.string().optional(),
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

const toStudentIds = (value) =>
  (value || []).map((s) => (typeof s === "object" ? s.id : s));

const ClassEventWizard = ({
  open,
  onClose,
  onSaved,
  classData,
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
      name: classData?.name || "",
      start_date: classData?.start_time ? dayjs(classData.start_time) : dayjs(),
      start_time: classData?.start_time
        ? dayjs(classData.start_time).format("HH:mm")
        : dayjs().format("HH:mm"),
      duration: classData?.duration || 60,
      tags: classData?.tags || [],
    },
  });

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
      start_time: combined.toISOString(),
      duration: data.duration,
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
        toast.success("The class event was scheduled successfully");
        onSaved?.();
        reset();
        onClose?.();
      } else {
        toast.error(result.error || "Failed to schedule class.");
      }
    } catch (error) {
      console.error("Error:", error.message);
      toast.error("Failed to schedule class.");
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
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
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
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
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
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
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
      title={classData ? "Edit class" : "Schedule a class"}
      steps={steps}
      submitting={isSubmitting}
      submitLabel={classData ? "Save changes" : "Schedule class"}
      onNext={(step) => (step === 0 ? trigger(DETAIL_FIELDS) : true)}
      onSubmit={handleSubmit(handleFinalSubmit)}
    />
  );
};

export default ClassEventWizard;
