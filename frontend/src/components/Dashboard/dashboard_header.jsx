import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { motion } from "framer-motion";

const DashboardHeader = ({ profileData }) => {
  console.log(profileData);
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
      <Paper
        elevation={6}
        sx={{
          p: 3,
          mb: 3,
          mt: 2,
          borderRadius: "20px",
          background: "rgba(40,40,40,0.75)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff",
        }}
      >
        {profileData ? (
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              mb: 0.5,
            }}
          >
            👋 {greeting},{" "}
            {profileData.first_name || profileData.username || "Teacher"}
          </Typography>
        ) : (
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              mb: 0.5,
            }}
          >
            👋 {greeting}
          </Typography>
        )}

        <Typography
          variant="subtitle1"
          sx={{
            color: "rgba(255,255,255,0.7)",
            fontWeight: 400,
          }}
        >
          Here’s what’s coming up in your schedule.
        </Typography>
      </Paper>
    </motion.div>
  );
};

export default DashboardHeader;
