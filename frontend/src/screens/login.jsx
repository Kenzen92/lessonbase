import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button, Grid, TextField, Typography, Box, Divider, CircularProgress } from "@mui/material";
import { GoogleLogin } from '@react-oauth/google';
import { motion } from "framer-motion";
import { useAuth } from "../contexts/auth_context";
import { loginUser, googleAuth, checkBackendHealth } from "../services/authService";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const initializeBackend = async () => {
      // First check without showing any toast
      if (await checkBackendHealth()) {
        toast.success("Connected to backend server", { autoClose: 2000 });
        return;
      }

      // If first check failed, start the retry process with loading toast
      const toastId = toast.loading("Connecting to backend server...", {
        autoClose: false,
      });

      const startTime = Date.now();
      const timeout = 15000; // 15 seconds

      while (Date.now() - startTime < timeout) {
        // Update progress
        const progress = (Date.now() - startTime) / timeout;
        toast.update(toastId, { progress });

        // Check backend status
        if (await checkBackendHealth()) {
          toast.dismiss(toastId);
          toast.success("Backend server is now available!", {
            autoClose: 2000,
          });
          return;
        }

        // Wait 1 second before next attempt
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // If we get here, we've timed out
      toast.update(toastId, {
        render: "Backend server is not reachable. Please try again later.",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    };

    initializeBackend();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const data = await loginUser({ email, password });
      
      // Store token and update auth context
      login(data.token, data.user_type, data.user);
      
      toast.success(`Welcome back, ${data.user.first_name || data.user.email}!`);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed. Please check your credentials.");
      setEmailError(true);
      setPasswordError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    
    try {
      // The credentialResponse contains the JWT token, not access_token
      // We need to send it to our backend which will verify it
      const data = await googleAuth(credentialResponse.credential, 'student');
      
      // Store token and update auth context
      login(data.token, data.user_type, data.user);
      
      if (data.is_new_user) {
        toast.success(`Welcome to LessonBase, ${data.user.first_name || data.user.email}!`);
      } else {
        toast.success(`Welcome back, ${data.user.first_name || data.user.email}!`);
      }
      
      navigate("/dashboard");
    } catch (error) {
      console.error("Google login error:", error);
      toast.error(error.message || "Google login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error("Google login was unsuccessful. Please try again.");
  };

  return (
    <Grid
      container
      sx={{ minHeight: "100vh", width: "100%", flexDirection: "row" }}
    >
      <Grid
        sx={{
          width: "50%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background:
            "linear-gradient(0deg, rgba(0,28,91,1) 0%, rgba(9,85,121,1) 52%, rgba(0,212,255,1) 100%)",
          color: "white",
        }}
      >
        <motion.div
          initial={{ opacity: 0.1 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
        >
          <Box textAlign="center">
            <Typography variant="h3" component="h1">
              LessonBase
            </Typography>
            <Typography variant="h6">A teaching solution for all.</Typography>
          </Box>
        </motion.div>
      </Grid>
      <Grid
        sx={{
          width: "50%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box textAlign="center" width="80%" maxWidth="400px">
          {showForm ? (
            <motion.div
              initial={{ opacity: 0, x: -500 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Typography variant="h5" sx={{ mb: 3 }}>
                Sign In
              </Typography>

              {/* Google Sign In */}
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap
                  theme="filled_blue"
                  size="large"
                  text="signin_with"
                />
              </Box>

              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>

              {/* Email/Password Form */}
              <form onSubmit={handleLogin}>
                <TextField
                  fullWidth
                  label="Email"
                  variant="outlined"
                  type="email"
                  InputLabelProps={{
                    style: { color: "#fff" },
                  }}
                  InputProps={{
                    style: { color: "#fff" },
                  }}
                  margin="normal"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(false);
                  }}
                  error={emailError}
                  disabled={isLoading}
                />
                <TextField
                  fullWidth
                  label="Password"
                  variant="outlined"
                  InputLabelProps={{
                    style: { color: "#fff" },
                  }}
                  InputProps={{
                    style: { color: "#fff" },
                  }}
                  type="password"
                  margin="normal"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(false);
                  }}
                  error={passwordError}
                  disabled={isLoading}
                />
                
                <Box sx={{ mt: 1, mb: 2, textAlign: "right" }}>
                  <Link to="/forgot-password" style={{ textDecoration: "none" }}>
                    <Typography variant="body2" color="primary">
                      Forgot Password?
                    </Typography>
                  </Link>
                </Box>

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{ mt: 2 }}
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={24} /> : "Sign In"}
                </Button>
              </form>

              <Box mt={2}>
                <Typography variant="body2">
                  Don't have an account?{" "}
                  <Link to="/signup" style={{ textDecoration: "none" }}>
                    <Button variant="text" color="secondary" disabled={isLoading}>
                      Sign Up Here
                    </Button>
                  </Link>
                </Typography>
              </Box>
            </motion.div>
          ) : (
            <Box>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setShowForm(true)}
                size="large"
              >
                Sign In
              </Button>
              <Box mt={2}>
                <Typography variant="body2">
                  Don't have an account?{" "}
                  <Link to="/signup" style={{ textDecoration: "none" }}>
                    <Button variant="text" color="secondary">
                      Sign Up Here
                    </Button>
                  </Link>
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Grid>
    </Grid>
  );
}

export default Login;
