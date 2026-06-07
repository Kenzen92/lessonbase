// Profile / Settings — Luminous redesign. All form logic (Formik + yup, avatar
// upload, submit) is preserved from the original; only the chrome and field
// styling move onto the Luminous design system.
import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  CircularProgress,
  Avatar,
  IconButton,
  FormControl,
  FormHelperText,
} from "@mui/material";
import * as yup from "yup";
import { useFormik } from "formik";

import { AppShell, StripCard, PrimaryActionButton, lumi, lumiType, tint, LumiIcon } from "../components/luminous";
import { useUser } from "../contexts/user_context";
import { useSubjects } from "../contexts/subjects_context";
import { getToken, setUser as cacheUser } from "../utils/tokenStorage";
import { resolveMediaUrl } from "../utils/media";

const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

// Token-styled MUI TextField.
const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: lumi.color.surfaceContainerHigh,
    borderRadius: lumi.radius.md,
    color: lumi.color.onSurface,
    "& fieldset": { borderColor: lumi.color.outlineVariant },
    "&:hover fieldset": { borderColor: lumi.color.outline },
    "&.Mui-focused fieldset": { borderColor: lumi.color.primary, borderWidth: 2 },
  },
  "& .MuiInputLabel-root": { color: lumi.color.onSurfaceVariant, fontFamily: lumi.font.body },
  "& .MuiInputLabel-root.Mui-focused": { color: lumi.color.primary },
  "& .MuiFormHelperText-root": { color: lumi.color.error },
};

const validationSchema = yup.object({
  username: yup.string().required("Username is required"),
  first_name: yup.string().required("First name is required"),
  last_name: yup.string(),
  email: yup.string().email("Enter a valid email").required("Email is required"),
  subjects: yup
    .array()
    .of(yup.object({ value: yup.number().required(), label: yup.string().required() }))
    .min(1, "Please select at least one subject"),
});

function Profile() {
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreviewUrl, setProfilePicturePreviewUrl] = useState(null);
  const [userName, setName] = useState(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const { user, isLoading: userLoading, refetch, setUser, firstName, profilePicture } = useUser();
  const { data: userSubjects, refetch: refetchSubjects, allSubjects } = useSubjects();
  const { data: subjectsData, isLoading: subjectsLoading } = allSubjects || {};

  const subjectOptions = (subjectsData ?? []).map((s) => ({ value: s.id, label: s.name }));

  const formik = useFormik({
    initialValues: { username: "", first_name: "", last_name: "", email: "", subjects: [] },
    validationSchema,
    onSubmit: async (values) => {
      const formData = new FormData();
      formData.append("username", values.username);
      formData.append("first_name", values.first_name);
      formData.append("last_name", values.last_name);
      formData.append("email", values.email);
      values.subjects.forEach((subject) => formData.append("subjects", subject.value));
      if (profilePictureFile) formData.append("profile_picture", profilePictureFile);

      try {
        const auth = getToken();
        if (!auth) {
          toast.error("Authentication token not found. Please log in again.");
          navigate("/login");
          return;
        }
        const response = await fetch(`${BASE_URL}/profile/`, {
          method: "POST",
          headers: { Authorization: `Token ${auth}` },
          body: formData,
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          toast.error(
            errorData.detail ||
              errorData.message ||
              `Error updating profile: ${response.status} ${response.statusText}`
          );
          return;
        }
        const updatedUser = await response.json();
        cacheUser(updatedUser);
        if (setUser) setUser(updatedUser);
        if (refetch) await refetch();
        if (refetchSubjects) await refetchSubjects();
        setName(updatedUser.first_name);
        setProfilePicturePreviewUrl(null);
        toast.success("Profile data updated successfully");
      } catch (error) {
        toast.error(`An error occurred: ${error.message}`);
      }
    },
  });

  // Populate the form from contexts.
  useEffect(() => {
    setLoading(true);
    if (!userLoading && user) {
      setName(user.first_name);
      const selectedFromUser = (userSubjects ?? user?.subjects ?? []).map((s) => ({
        value: s.id,
        label: s.name,
      }));
      formik.setValues({
        username: user.username || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        subjects: selectedFromUser,
      });
      setProfilePicturePreviewUrl(user.profile_picture || null);
    }
    if (!userLoading && !subjectsLoading) setLoading(false);
    return () => {
      if (profilePicturePreviewUrl) URL.revokeObjectURL(profilePicturePreviewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userLoading, subjectsData, subjectsLoading]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (profilePicturePreviewUrl) URL.revokeObjectURL(profilePicturePreviewUrl);
      setProfilePicturePreviewUrl(URL.createObjectURL(file));
      setProfilePictureFile(file);
    } else {
      setProfilePicturePreviewUrl(user?.profile_picture || null);
      setProfilePictureFile(null);
    }
  };

  // React-Select tuned to Luminous tokens (chip-style multi values).
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: lumi.color.surfaceContainerHigh,
      borderColor: state.isFocused ? lumi.color.primary : lumi.color.outlineVariant,
      boxShadow: state.isFocused ? `0 0 0 1px ${lumi.color.primary}` : "none",
      borderRadius: 8,
      minHeight: 48,
      "&:hover": { borderColor: lumi.color.outline },
    }),
    input: (base) => ({ ...base, color: lumi.color.onSurface }),
    placeholder: (base) => ({ ...base, color: lumi.color.onSurfaceVariant }),
    menu: (base) => ({ ...base, backgroundColor: lumi.color.surfaceContainerHigh, zIndex: 1000 }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? tint(lumi.color.primary, 0.25)
        : state.isFocused
        ? lumi.color.surfaceVariant
        : "transparent",
      color: lumi.color.onSurface,
    }),
    multiValue: (base) => ({ ...base, backgroundColor: tint(lumi.color.primary, 0.15), borderRadius: 9999 }),
    multiValueLabel: (base) => ({ ...base, color: lumi.color.primary }),
    multiValueRemove: (base) => ({
      ...base,
      color: lumi.color.primary,
      borderRadius: 9999,
      "&:hover": { backgroundColor: lumi.color.primaryContainer, color: lumi.color.onSurface },
    }),
  };

  return (
    <AppShell
      activeNav="settings"
      user={{ userName: firstName, avatarUrl: resolveMediaUrl(profilePicture) }}
    >
      <Box sx={{ maxWidth: 640, mx: "auto" }}>
        <StripCard accent="primary" hover={false}>
          {/* Identity header */}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 1 }}>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={profilePicturePreviewUrl || resolveMediaUrl(user?.profile_picture) || undefined}
                alt={userName || "Profile"}
                sx={{ width: 96, height: 96, border: `3px solid ${lumi.color.primary}`, bgcolor: lumi.color.surfaceVariant }}
              >
                {userName ? userName[0].toUpperCase() : null}
              </Avatar>
              <IconButton
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload new profile picture"
                sx={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 32,
                  height: 32,
                  backgroundColor: lumi.color.primaryContainer,
                  color: lumi.color.onSurface,
                  "&:hover": { backgroundColor: lumi.color.primaryContainer, filter: "brightness(0.9)" },
                }}
              >
                <LumiIcon name="edit" sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
            <Typography component="h1" sx={{ ...lumiType.headlineLg, color: lumi.color.onBackground, mt: 1 }}>
              {userName ? `${userName}'s Profile` : "Profile"}
            </Typography>
            <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant }}>
              Manage your account settings and preferences.
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress sx={{ color: lumi.color.primary }} />
            </Box>
          ) : (
            <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 4 }}>
              <Typography sx={{ ...lumiType.headlineMd, color: lumi.color.onBackground, mb: 2 }}>
                Personal Information
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <TextField
                  fullWidth
                  id="username"
                  name="username"
                  label="Username"
                  value={formik.values.username}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.username && Boolean(formik.errors.username)}
                  helperText={formik.touched.username && formik.errors.username}
                  sx={fieldSx}
                />

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
                  <TextField
                    fullWidth
                    id="first_name"
                    name="first_name"
                    label="First Name"
                    value={formik.values.first_name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.first_name && Boolean(formik.errors.first_name)}
                    helperText={formik.touched.first_name && formik.errors.first_name}
                    sx={fieldSx}
                  />
                  <TextField
                    fullWidth
                    id="last_name"
                    name="last_name"
                    label="Last Name"
                    value={formik.values.last_name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.last_name && Boolean(formik.errors.last_name)}
                    helperText={formik.touched.last_name && formik.errors.last_name}
                    sx={fieldSx}
                  />
                </Box>

                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email Address"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                  sx={fieldSx}
                />
              </Box>

              <Typography sx={{ ...lumiType.headlineMd, color: lumi.color.onBackground, mt: 4, mb: 2 }}>
                Teaching Subjects
              </Typography>
              <FormControl fullWidth error={formik.touched.subjects && Boolean(formik.errors.subjects)}>
                <Select
                  inputId="subjects"
                  name="subjects"
                  value={formik.values.subjects}
                  onChange={(selected) => {
                    formik.setFieldValue("subjects", selected || []);
                    formik.setFieldTouched("subjects", true, false);
                  }}
                  onBlur={() => formik.setFieldTouched("subjects", true)}
                  options={subjectOptions}
                  isMulti
                  styles={selectStyles}
                  placeholder="Select subjects…"
                />
                {formik.touched.subjects && formik.errors.subjects && (
                  <FormHelperText sx={{ color: lumi.color.error }}>{formik.errors.subjects}</FormHelperText>
                )}
              </FormControl>

              <PrimaryActionButton
                type="submit"
                size="large"
                icon="settings"
                label={formik.isSubmitting ? "Updating…" : "Update Profile"}
                disabled={formik.isSubmitting}
                sx={{ width: "100%", mt: 4 }}
              />
            </Box>
          )}
        </StripCard>
      </Box>
    </AppShell>
  );
}

export default Profile;
