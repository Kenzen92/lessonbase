import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button, Grid, TextField, Typography, Box } from "@mui/material";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/auth_context";
import { useUser } from "../contexts/user_context";
const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [usernameError, setUsernameError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const { getUser } = useUser();

  const checkBackendStatus = async () => {
    const url = `${BASE_URL}/health/`;
    try {
      const response = await fetch(url);
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    const initializeBackend = async () => {
      // First check without showing any toast
      if (await checkBackendStatus()) {
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
        if (await checkBackendStatus()) {
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
    const url = `${BASE_URL}/login`;
    const payload = {
      username: username,
      password: password,
    };
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        toast.error("Username or password not correct");
        setUsernameError(true);
        setPasswordError(true);
        return;
      }

      const data = await response.json();
      window.sessionStorage.setItem("token", data["token"]);
      setAuth({ token: data.token, userType: data.user_type });
      getUser();
      navigate("/dashboard");
    } catch (error) {
      console.log(error);
      toast.error("Connection error. Please try again later.");
    }
  };

  return (
    <Grid container sx={{ minHeight: "100vh" }}>
      <Grid
        item
        xs={12}
        sx={{
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
              Kenny Solutions
            </Typography>
            <Typography variant="h6">A teaching solution for all.</Typography>
          </Box>
        </motion.div>
      </Grid>
      <Grid
        item
        xs={12}
        sx={{
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
              <form onSubmit={handleLogin}>
                <TextField
                  fullWidth
                  label="Username"
                  variant="outlined"
                  InputLabelProps={{
                    style: { color: "#fff" },
                  }}
                  InputProps={{
                    style: { color: "#fff" },
                  }}
                  margin="normal"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUsernameError(false);
                  }}
                  error={usernameError}
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
                />
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{ mt: 2 }}
                >
                  Login
                </Button>
              </form>
            </motion.div>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={() => setShowForm(true)}
            >
              Sign In
            </Button>
          )}
          {!showForm && (
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
          )}
        </Box>
      </Grid>
    </Grid>
  );
}

export default Login;
