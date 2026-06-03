import React from "react";
import { Box, Typography, Chip, Link } from "@mui/material";
import { FaFile } from "react-icons/fa";
import { resolveMediaUrl } from "../../utils/media";

/**
 * Read-only list of files a student submitted with their assignment attempt.
 * Used in the teacher grading modal to display what was submitted.
 */
const AssignmentAttemptFiles = ({ files = [] }) => {
  if (files.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>
        No files submitted.
      </Typography>
    );
  }

  return (
    <Box>
      {files.map((resource, i) => (
        <Chip
          key={resource.id ?? i}
          icon={<FaFile size={12} />}
          label={
            <Link
              href={resolveMediaUrl(resource.file || resource.file_url)}
              target="_blank"
              rel="noopener noreferrer"
              download={resource.original_name || resource.title}
              sx={{ color: "inherit", textDecoration: "none" }}
            >
              {resource.title || resource.original_name || "File"}
            </Link>
          }
          color="primary"
          sx={{ m: "0.25rem", width: "100%", justifyContent: "space-between" }}
        />
      ))}
    </Box>
  );
};

export default AssignmentAttemptFiles;
