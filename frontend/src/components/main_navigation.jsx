import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import handleUnauthorizedRequest from "./unautherized_request";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Button,
  Box,
  Grid,
} from "@mui/material";

const Navigation = () => {
  const navigate = useNavigate();

  // useEffect to call loadUserData when the component mounts
  useEffect(() => {}, []); // Empty dependency array means this runs once on mount

  async function handleLogout() {
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

      if (response.status == 401) {
        handleUnauthorizedRequest(navigate);
      }

      if (!response.ok) {
        toast.error("Couldn't logout");
        return;
      }

      await window.sessionStorage.removeItem("Token");
      navigate("/login");
    } catch (error) {
      console.log(error);
      toast.error("Connection error. Please try again later.");
    }
  }

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Calendar", path: "/calendar" },
    { label: "Students", path: "/students" },
    { label: "Assignments", path: "/assignments" },
    { label: "Settings", path: "/profile" },
    { label: "Logout", path: "/", action: handleLogout },
  ];

  return (
    <Box
      sx={{
        height: "4rem",
        width: "100%",
      }}
    >
      <nav className="navigation">
        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}>
          {navItems.map((item) => (
            <Button
              key={item.label}
              component={Link}
              to={item.path}
              onClick={item.action || null}
              color="inherit"
              sx={{ color: "#fff", textTransform: "none" }}
            >
              <Typography variant={"h6"}>{item.label}</Typography>
            </Button>
          ))}
        </Box>
      </nav>
    </Box>
  );
};

export default Navigation;
