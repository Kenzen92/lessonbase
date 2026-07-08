import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { IconContext } from "react-icons";
import Login from "./screens/login";
import Signup from "./screens/signup";
import VerifyEmail from "./screens/verify-email";
import ForgotPassword from "./screens/forgot-password";
import ResetPassword from "./screens/reset-password";
import Profile from "./screens/profile";
import Settings from "./screens/settings";
import PrivateRoutes, { RoleRoute } from "./components/privateRoute";
import ToastNotification from "./components/notification";
import Students from "./screens/students";
import Teachers from "./screens/teachers";
import Classes from "./screens/class-groups";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import Assignments from "./screens/assignments";
import Resources from "./screens/resources";
import DashboardLuminous from "./screens/dashboard-luminous";
import { useAuth } from "./contexts/auth_context";
import InteractiveClassroom from "./components/InteractiveClassroom/InteractiveClassroom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { darkTheme } from "./styles/theme";
import * as Sentry from "@sentry/react";

function App() {
  const { auth } = useAuth();

  return (
    <Sentry.ErrorBoundary
      fallback={
        <p>
          <strong>An error has occurred.</strong> Our team has been notified.
        </p>
      }
    >
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <IconContext.Provider
        value={{ color: "blue", className: "global-class-name" }}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/signup/student" element={<Signup defaultUserType="student" />} />
              <Route path="/signup/teacher" element={<Signup defaultUserType="teacher" />} />
              <Route path="/auth/verify-email/:key" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/reset-password/:uid/:token" element={<ResetPassword />} />
              <Route
                path="/"
                element={
                  auth.token ? (
                    <Navigate to="/dashboard" />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route element={<PrivateRoutes />}>
                <Route
                  path="/dashboard/:id?"
                  element={<DashboardLuminous />}
                />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                {/* Role-scoped directories: teachers browse students, students
                    browse their teachers. Wrong-role visits bounce to the
                    equivalent page. */}
                <Route element={<RoleRoute allow="teacher" redirectTo="/teachers" />}>
                  <Route path="/students/:id?" element={<Students />} />
                </Route>
                <Route element={<RoleRoute allow="student" redirectTo="/students" />}>
                  <Route path="/teachers/:id?" element={<Teachers />} />
                </Route>
                <Route path="/class-groups/:id?" element={<Classes />} />
                <Route path="/assignments/:id?" element={<Assignments />} />
                <Route path="/resources" element={<Resources />} />
                <Route
                  path="/interactive-classroom/:accessToken"
                  element={<InteractiveClassroom />}
                />
              </Route>
            </Routes>
          </Router>
          <ToastNotification />
        </LocalizationProvider>
      </IconContext.Provider>
    </ThemeProvider>
    </Sentry.ErrorBoundary>
  );
}

export default App;
