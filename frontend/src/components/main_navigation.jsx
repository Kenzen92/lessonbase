import React, { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import handleUnauthorizedRequest from "./unautherized_request";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Tooltip,
  Box,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useAuth } from "../contexts/auth_context";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openLogoutDialog, setOpenLogoutDialog] = React.useState(false);
  const {auth} = useAuth();

  useEffect(() => {}, []);

  const handleLogoutConfirm = async () => {
    const url = "http://localhost:8000/logout/";
    const auth = window.sessionStorage.getItem("token");

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Token ${auth}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        handleUnauthorizedRequest(navigate);
      }

      if (!response.ok) {
        toast.error("Couldn't logout");
        return;
      }

      window.sessionStorage.removeItem("token");
      navigate("/login");
    } catch (error) {
      console.error(error);
      toast.error("Connection error. Please try again later.");
    } finally {
      setOpenLogoutDialog(false);
    }
  };

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Students", path: "/students" },
    { label: "Classes", path: "/classes" },
    { label: "Assignments", path: "/assignments" },
    { label: "Settings", path: "/profile" },
    { label: "Logout", path: "/", action: () => setOpenLogoutDialog(true) },
  ];

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Grid container spacing={2} alignItems="center">
          {navItems.map((item) => {
            if ((item.label === "Students" && auth.userType !== "Teacher") || (item.label === "Classes" && auth.userType !== "Teacher")) {
              return null; // Skip rendering this item
            }
            return (

              <Grid item key={item.label} sx={{ marginLeft: item.label === "Logout" ? 'auto' : null}}>
                <Tooltip
                  title={
                    item.label === "Logout" ? "Sign out" : `Go to ${item.label}`
                  }
                >
                  <Button
                    component={item.label === "Logout" ? "button" : Link}
                    to={item.path}
                    onClick={item.action || null}
                    color="inherit"
                    sx={{
                      color: "#fff",
                      textTransform: "none",
                      borderBottom:
                        location.pathname === item.path
                          ? "2px solid #fff"
                          : "none",
                      ":hover": {
                        color: "#ffcc00",
                      },
                    }}
                  >
                    <Typography variant="h6">{item.label}</Typography>
                  </Button>
                </Tooltip>
              </Grid>
            );
          })}
          </Grid>
        </Toolbar>
      </AppBar>

      <Dialog
        open={openLogoutDialog}
        onClose={() => setOpenLogoutDialog(false)}
      >
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to logout?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLogoutDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleLogoutConfirm} color="secondary" autoFocus>
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Navigation;
