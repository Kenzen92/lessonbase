import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Button,
  TextField,
  Typography,
  Box,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  CircularProgress,
} from "@mui/material";
import { GoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion";
import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";
import { registerUser, googleAuth } from "../services/authService";
import { useAuth } from "../contexts/auth_context";
import "../styles/signup.css";

function Signup({ defaultUserType = null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userType, setUserType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    if (defaultUserType) {
      setUserType(defaultUserType);
    }
  }, [defaultUserType]);

  const handleUserTypeChange = (event, newUserType) => {
    if (newUserType !== null) {
      setUserType(newUserType);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Client-side validation
    if (password !== passwordConfirm) {
      setErrors({ password: "Passwords don't match" });
      setIsLoading(false);
      toast.error("Passwords don't match");
      return;
    }

    try {
      const data = await registerUser({
        email,
        password,
        password_confirm: passwordConfirm,
        user_type: userType,
        first_name: firstName,
        last_name: lastName,
      });

      toast.success(
        data.message ||
          "Registration successful! Please check your email to verify your account."
      );

      // Redirect to login page
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.message || "Registration failed. Please try again.");

      // Parse error messages if available
      if (error.message.includes("email")) {
        setErrors({ email: error.message });
      } else if (error.message.includes("password")) {
        setErrors({ password: error.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);

    try {
      const data = await googleAuth(credentialResponse.credential, userType);

      // Store token and update auth context
      login(data.token, data.user_type, data.user);

      if (data.is_new_user) {
        toast.success(
          `Welcome to LessonBase, ${data.user.first_name || data.user.email}!`
        );
      } else {
        toast.success(
          `Welcome back, ${data.user.first_name || data.user.email}!`
        );
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Google signup error:", error);
      toast.error(error.message || "Google signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error("Google signup was unsuccessful. Please try again.");
  };

  return (
    <Grid container sx={{ minHeight: "100vh", width: "100%" }}>
      {/* Left side - Branding */}
      <Grid
        item
        xs={12}
        md={6}
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background:
            "linear-gradient(0deg, rgba(0,28,91,1) 0%, rgba(9,85,121,1) 52%, rgba(0,212,255,1) 100%)",
          color: "white",
          p: 4,
        }}
      >
        <motion.div
          initial={{ opacity: 0.1 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
        >
          <Box textAlign="center">
            <Typography variant="h3" component="h1" gutterBottom>
              LessonBase
            </Typography>
            <Typography variant="h6">Join our teaching community</Typography>
          </Box>
        </motion.div>
      </Grid>

      {/* Right side - Signup Form */}
      <Grid
        item
        xs={12}
        md={6}
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 4,
        }}
      >
        <Box sx={{ width: "100%", maxWidth: "450px" }}>
          <motion.div
            initial={{ opacity: 0, x: 500 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography
              variant="h4"
              component="h2"
              gutterBottom
              textAlign="center"
            >
              Create Account
            </Typography>

            {/* User Type Selection */}
            <Box sx={{ my: 3, display: "flex", justifyContent: "center" }}>
              <ToggleButtonGroup
                value={userType}
                exclusive
                onChange={handleUserTypeChange}
                aria-label="user type"
                color="primary"
                fullWidth
              >
                <ToggleButton value="student" aria-label="student">
                  <PersonIcon sx={{ mr: 1 }} />
                  Student
                </ToggleButton>
                <ToggleButton value="teacher" aria-label="teacher">
                  <SchoolIcon sx={{ mr: 1 }} />
                  Teacher
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Google Sign Up */}
            <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
              <Box
                sx={{
                  opacity: userType ? 1 : 0.5,
                  pointerEvents: userType ? "auto" : "none",
                }}
              >
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_blue"
                  size="large"
                  text="signup_with"
                />
              </Box>
            </Box>

            {!userType && (
              <Typography
                variant="body2"
                color="warning.main"
                textAlign="center"
                sx={{ mb: 2 }}
              >
                Please select an account type above to continue
              </Typography>
            )}

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>

            {/* Email/Password Form */}
            <form onSubmit={handleRegister}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    variant="outlined"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isLoading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    variant="outlined"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isLoading}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Email"
                variant="outlined"
                type="email"
                margin="normal"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors({ ...errors, email: null });
                }}
                error={!!errors.email}
                helperText={errors.email}
                required
                disabled={isLoading}
              />

              <TextField
                fullWidth
                label="Password"
                variant="outlined"
                type="password"
                margin="normal"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors({ ...errors, password: null });
                }}
                error={!!errors.password}
                helperText={errors.password || "Must be at least 8 characters"}
                required
                disabled={isLoading}
              />

              <TextField
                fullWidth
                label="Confirm Password"
                variant="outlined"
                type="password"
                margin="normal"
                value={passwordConfirm}
                onChange={(e) => {
                  setPasswordConfirm(e.target.value);
                  setErrors({ ...errors, password: null });
                }}
                error={!!errors.password}
                required
                disabled={isLoading}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                color="primary"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={isLoading || !userType}
              >
                {isLoading ? <CircularProgress size={24} /> : "Sign Up"}
              </Button>
            </form>

            <Box textAlign="center" mt={2}>
              <Typography variant="body2">
                Already have an account?{" "}
                <Link to="/login" style={{ textDecoration: "none" }}>
                  <Button variant="text" color="secondary" disabled={isLoading}>
                    Sign In Here
                  </Button>
                </Link>
              </Typography>
            </Box>
          </motion.div>
        </Box>
      </Grid>
    </Grid>
  );
}

export default Signup;
