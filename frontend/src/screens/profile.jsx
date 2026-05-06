// Profile.js
import React, { useState, useEffect, useRef } from "react";
import Navigation from "../components/main_navigation";
import Select from "react-select";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Stack,
  IconButton, // Using IconButton for the clickable Avatar
  FormHelperText, // To display select errors
  FormControl,
  FormLabel,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles"; // Import useTheme for dark mode context
import * as yup from "yup"; // Import yup for validation
import { useFormik } from "formik"; // Import useFormik hook
import CloudUploadIcon from "@mui/icons-material/CloudUpload"; // Optional: Icon for upload hint
import inputStyle from "../styles/input";
import { useUser } from "../contexts/user_context";
import { useSubjects } from "../contexts/subjects_context";
const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

// Styled components for modern look (optional, can use sx prop too)
const ProfileContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: theme.spacing(4),
  backgroundColor: "#333",
  borderRadius: theme.shape.borderRadius,
  maxWidth: "600px", // Increased max width for better form layout
  margin: theme.spacing(4, "auto"), // Center the container
  boxShadow: theme.shadows[5], // Add some shadow
}));

const FormStack = styled(Stack)(({ theme }) => ({
  width: "100%",
  gap: theme.spacing(3), // Use theme spacing
  marginTop: theme.spacing(3),
}));

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: theme.spacing(12),
  height: theme.spacing(12),
  cursor: "pointer", // Indicate it's clickable
  border: `3px solid ${theme.palette.primary.main}`, // Add a border
  "&:hover": {
    opacity: 0.8, // Visual feedback on hover
  },
}));

// Yup validation schema
const validationSchema = yup.object({
  username: yup.string().required("Username is required"),
  first_name: yup.string().required("First name is required"),
  last_name: yup.string(),
  email: yup
    .string()
    .email("Enter a valid email")
    .required("Email is required"),
  // Subjects validation can be more complex depending on requirements (e.g., min/max)
  subjects: yup
    .array()
    .of(
      yup.object({
        value: yup.number().required(),
        label: yup.string().required(),
      })
    )
    .min(1, "Please select at least one subject"), // Example: requires at least one subject
});

function Profile() {
  // Removed selectedSubjects state, will use Formik's state
  const [profilePictureFile, setProfilePictureFile] = useState(null); // Store the file object
  const [profilePicturePreviewUrl, setProfilePicturePreviewUrl] =
    useState(null); // Store URL for preview
  const [userName, setName] = useState(null); // Keep for displaying name outside form
  const [loading, setLoading] = useState(true); // Loading state
  const fileInputRef = useRef(null); // Ref for the hidden file input
  const navigate = useNavigate();
  const theme = useTheme(); // Access the current theme (for dark/light mode colors)
  // Rename to avoid collisions between different `isLoading` values
  const { user, isLoading: userLoading, isError, refetch, setUser } = useUser();
  const {
    data: userSubjects, // user's subjects (same as before)
    isLoading: userSubjectsLoading,
    error: userSubjectsError,
    refetch: refetchSubjects, // Add refetch for subjects
    setSubjects,
    allSubjects, // new - the all-subjects query object
    setAllSubjects, // new - setter for all-subjects cache
  } = useSubjects();

  // pull data/loading for the full subjects list from the `allSubjects` query object
  const {
    data: subjectsData,
    isLoading: subjectsLoading,
    error: subjectsError,
  } = allSubjects || {};

  // map all subjects into select options (safe when subjectsData is undefined)
  const subjectOptions = (subjectsData ?? []).map((subject) => ({
    value: subject.id,
    label: subject.name,
  }));

  // Use Formik hook
  const formik = useFormik({
    initialValues: {
      username: "",
      first_name: "",
      last_name: "",
      email: "",
      subjects: [], // Store selected subject objects { value, label }
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      // Use values from Formik for submission
      const url = `${BASE_URL}/profile/`;
      const formData = new FormData();

      formData.append("username", values.username);
      formData.append("first_name", values.first_name);
      formData.append("last_name", values.last_name);
      formData.append("email", values.email);

      // Append subject IDs
      values.subjects.forEach((subject) => {
        formData.append("subjects", subject.value);
      });

      // Append the new profile picture file if selected
      if (profilePictureFile) {
        formData.append("profile_picture", profilePictureFile);
      }

      try {
        const auth = window.sessionStorage.getItem("token");
        if (!auth) {
          toast.error("Authentication token not found. Please log in again.");
          navigate("/login"); // Redirect to login if no token
          return;
        }

        const response = await fetch(url, {
          method: "POST", // Or PUT/PATCH depending on your API
          headers: {
            Authorization: `Token ${auth}`,
            // Don't set Content-Type for FormData, browser does it
          },
          body: formData,
        });

        if (!response.ok) {
          // Attempt to read error message from backend if available
          const errorData = await response.json().catch(() => ({})); // Handle potential JSON parse errors
          const errorMessage =
            errorData.detail ||
            errorData.message ||
            `Error updating profile: ${response.status} ${response.statusText}`;
          toast.error(errorMessage);
          console.error("Network response was not ok:", response);
          console.error("Error details:", errorData);
          return;
        }

        const data = await response.json();
        const updatedUser = data; // Assuming the backend returns the updated user object

        // Update user data in session storage
        window.sessionStorage.setItem("user", JSON.stringify(updatedUser));
        console.log("User data updated in session storage.");

        // Update the user cache in context and refetch to ensure consistency
        if (setUser) setUser(updatedUser);
        if (refetch) await refetch(); // Refetch user data to get fresh data from server

        // Refetch subjects to ensure the user's subjects are up to date
        if (refetchSubjects) await refetchSubjects();

        setName(updatedUser.first_name); // Update displayed name
        setProfilePicturePreviewUrl(null); // Clear preview as the new official URL is set

        toast.success("Profile data updated successfully");
      } catch (error) {
        console.error("Error:", error.message);
        toast.error(`An error occurred: ${error.message}`);
      }
    },
  });

  // Populate the form and select options from contexts instead of direct fetches
  useEffect(() => {
    const populateFromContexts = () => {
      setLoading(true);

      if (!userLoading && user) {
        setName(user.first_name);

        // compute selected options from the user's subjects (prefer the subjects query if available)
        const selectedFromUser = (userSubjects ?? user?.subjects ?? []).map(
          (subject) => ({
            value: subject.id,
            label: subject.name,
          })
        );

        formik.setValues({
          username: user.username || "",
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          email: user.email || "",
          subjects: selectedFromUser,
        });

        setProfilePicturePreviewUrl(user.profile_picture || null);
      }

      // when both user and subjects are ready we can hide the loading spinner
      if (!userLoading && !subjectsLoading) setLoading(false);
    };

    populateFromContexts();

    // Cleanup for the profile picture preview URL
    return () => {
      if (profilePicturePreviewUrl) {
        URL.revokeObjectURL(profilePicturePreviewUrl);
      }
    };
  }, [user, userLoading, subjectsData, subjectsLoading]);

  // Effect to handle storage changes (optional, might not be necessary if data is fetched on mount)
  // and to revoke old preview URLs when a new file is selected.
  useEffect(() => {
    const handleStorageChange = () => {
      console.log("Storage event detected, reloading user data");
      // Re-fetch or update state based on storage if necessary
      // For this form context, the initial fetch on mount is usually sufficient,
      // and the submit updates storage which is then handled by the submit success logic.
      // If other tabs/windows can change this, you might need more complex sync logic.
      // For now, let's rely on the submit success to update local state and the Formik values via profileData dependency.
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      // Cleanup any existing preview URL on unmount
      if (profilePicturePreviewUrl) {
        URL.revokeObjectURL(profilePicturePreviewUrl);
      }
    };
  }, [profilePicturePreviewUrl]); // Add profilePicturePreviewUrl to dependencies for cleanup logic

  // Handle file input change
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Revoke the previous preview URL if it exists
      if (profilePicturePreviewUrl) {
        URL.revokeObjectURL(profilePicturePreviewUrl);
      }
      // Create a new preview URL
      const newPreviewUrl = URL.createObjectURL(file);
      setProfilePicturePreviewUrl(newPreviewUrl);
      setProfilePictureFile(file); // Store the file object for submission
    } else {
      // If file selection is cancelled
      setProfilePicturePreviewUrl(user?.profile_picture || null); // Revert to original if available
      setProfilePictureFile(null);
    }
  };

  // Trigger the hidden file input click
  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  // Custom styles for React-Select to fit dark mode
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,

      backgroundColor: theme.palette.grey[800],
      borderColor: state.isFocused
        ? theme.palette.primary.main
        : theme.palette.mode === "dark"
        ? theme.palette.grey[700]
        : theme.palette.grey[400],
      color: theme.palette.common.white,
      boxShadow: state.isFocused
        ? `0 0 0 1px ${theme.palette.primary.main}`
        : null,
      "&:hover": {
        borderColor: state.isFocused
          ? theme.palette.primary.main
          : theme.palette.grey[600],
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: theme.palette.common.white,
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: theme.palette.primary.dark,

      color: theme.palette.primary.contrastText,
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: theme.palette.primary.contrastText,
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: theme.palette.primary.contrastText,
      "&:hover": {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.common.white,
      },
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor:
        theme.palette.mode === "dark"
          ? theme.palette.grey[900]
          : theme.palette.background.paper,
      zIndex: 1000, // Ensure dropdown is above other content
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? theme.palette.primary.dark
        : state.isHovered
        ? theme.palette.grey[700]
        : "transparent",
      color: state.isSelected
        ? theme.palette.primary.contrastText
        : theme.palette.text.primary,
      "&:active": {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.common.white,
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: theme.palette.grey[500],
    }),
  };

  return (
    <>
      <Navigation />
      <ProfileContainer>
        <input // Hidden file input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <IconButton // Use IconButton for clickable area around Avatar
          onClick={handleAvatarClick}
          aria-label="upload new profile picture"
          sx={{ p: 0, ...inputStyle }} // Remove padding from IconButton
        >
          <ProfileAvatar
            alt={userName || "Profile Picture"}
            src={profilePicturePreviewUrl || user?.profile_picture} // Use preview URL if available, otherwise user's profile picture
          >
            {/* Fallback: first letter of username */}
            {userName ? userName[0] : <CloudUploadIcon />}{" "}
            {/* Optional: Upload icon fallback */}
          </ProfileAvatar>
        </IconButton>

        <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
          {userName ? `${userName}'s Profile` : ""}
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <form onSubmit={formik.handleSubmit} style={{ width: "100%" }}>
            <FormStack>
              {/* Username Field */}
              <TextField
                fullWidth
                id="username"
                name="username"
                label="Username"
                value={formik.values.username}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.username && Boolean(formik.errors.username)
                }
                helperText={formik.touched.username && formik.errors.username}
                variant="outlined" // Modern look
                sx={{ ...inputStyle }}
              />

              {/* First Name Field */}
              <TextField
                fullWidth
                id="first_name"
                name="first_name"
                label="First Name"
                value={formik.values.first_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.first_name && Boolean(formik.errors.first_name)
                }
                helperText={
                  formik.touched.first_name && formik.errors.first_name
                }
                variant="outlined"
                sx={{ ...inputStyle }}
              />

              {/* Last Name Field */}
              <TextField
                fullWidth
                id="last_name"
                name="last_name"
                label="Last Name"
                value={formik.values.last_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.last_name && Boolean(formik.errors.last_name)
                }
                helperText={formik.touched.last_name && formik.errors.last_name}
                variant="outlined"
                sx={{ ...inputStyle }}
              />

              {/* Email Field */}
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
                variant="outlined"
                sx={{ ...inputStyle }}
              />

              {/* Subjects Select */}
              <FormControl
                fullWidth
                error={
                  formik.touched.subjects && Boolean(formik.errors.subjects)
                }
              >
                <FormLabel sx={{ mb: 1, color: theme.palette.common.white }}>
                  Subjects
                </FormLabel>
                <Select
                  id="subjects"
                  name="subjects"
                  value={formik.values.subjects} // Use formik values
                  onChange={(selectedOptions) => {
                    formik.setFieldValue("subjects", selectedOptions || []); // Update formik value, handle null case
                    // Also trigger touch so error shows immediately if needed
                    formik.setFieldTouched("subjects", true, false); // Set touched without validating immediately
                  }}
                  onBlur={() => formik.setFieldTouched("subjects", true)} // Set touched on blur
                  options={subjectOptions}
                  isMulti={true}
                  styles={customSelectStyles} // Apply custom dark mode styles
                  placeholder="Select Subjects"
                />
                {/* Display Select errors */}
                {formik.touched.subjects && formik.errors.subjects && (
                  <FormHelperText>{formik.errors.subjects}</FormHelperText>
                )}
              </FormControl>

              <Button
                type="submit"
                variant="contained" // Modern button style
                color="primary"
                disabled={formik.isSubmitting} // Disable while submitting
                sx={{ mt: 2, py: 1.5 }} // Add margin top and vertical padding
              >
                {formik.isSubmitting ? (
                  <CircularProgress size={24} />
                ) : (
                  "Update Profile"
                )}
              </Button>
            </FormStack>
          </form>
        )}
      </ProfileContainer>
    </>
  );
}

export default Profile;
