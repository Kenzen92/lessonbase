import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { IconContext } from "react-icons";
import { FaFolder } from "react-icons/fa";
import Login from "./screens/login";
import Signup from "./screens/signup";
import ClassEventDashboard from "./components/Dashboard/class_event_dashboard";
import Profile from "./screens/profile";
import PrivateRoutes from "./components/privateRoute";
import ToastNotification from "./components/notification";
import Students from "./screens/students";
import Classes from "./screens/class-groups";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import Assignments from "./screens/assignments";
import { useAuth } from "./contexts/auth_context";
import InteractiveClassroom from "./components/InteractiveClassroom/InteractiveClassroom";

function App() {
  const { auth } = useAuth();

  return (
    <IconContext.Provider
      value={{ color: "blue", className: "global-class-name" }}
    >
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
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
                  element={<ClassEventDashboard />}
                />
                <Route path="/profile" element={<Profile />} />
                <Route path="/students/:id?" element={<Students />} />
                <Route path="/class-groups/:id?" element={<Classes />} />
                <Route path="/assignments/:id?" element={<Assignments />} />
                <Route path="/interactive-classroom/:id" element={<InteractiveClassroom />} />
              </Route>
            </Routes>
          </Router>
          <ToastNotification />
        </>
      </LocalizationProvider>
    </IconContext.Provider>
  );
}

export default App;
