import React, { useState } from "react";
import { Box, Typography, Button, Link, Chip } from "@mui/material";
import Dropzone from "./dropzone";
import { toast } from "react-toastify";
import { FaUpload } from "react-icons/fa";
import { useAuth } from "../../contexts/auth_context";
import { handleDeleteClassFile } from "../../utils/agent";

const ClassResources = ({
  assignmentAttemptId,
  classId,
  existing_resources,
  handleReloadData,
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const { auth } = useAuth();

  const handleFileDrop = (files) => {
    setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
  };

  const handleRemoveFile = (fileToRemove) => {
    setSelectedFiles((prevFiles) =>
      prevFiles.filter((file) => file !== fileToRemove)
    );
  };

  const handleDeleteFile = (resourceURL) => {
    const deleteBody = JSON.stringify({ file_url: resourceURL });
    handleDeleteClassFile(deleteBody)
      .then((response) => {
        if (response.ok) {
          toast.success("File deleted successfully");
          handleReloadData();
        } else {
          toast.error("Failed to delete file");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        toast.error("An error occurred while deleting the file");
      });
  };

  const handleSubmit = () => {
    console.log("submitting");
    const formData = new FormData();

    // Append selected files to form data
    selectedFiles.forEach((file) => {
      formData.append("file", file);
    });

    if (classId) formData.append("class_id", classId);
    if (assignmentAttemptId)
      formData.append("assignment_attempt_id", assignmentAttemptId);
    const auth = window.sessionStorage.getItem("token");
    fetch("http://localhost:8000/class_material", {
      method: "POST",
      headers: {
        Authorization: `Token ${auth}`,
      },
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        setSelectedFiles([]);
        toast.success("Resources uploaded successfully");
        handleReloadData();
      })
      .catch((error) => {
        console.error("Error:", error);
        toast.error("An error occurred while uploading resources");
      });
  };

  return (
    <Box>
      <Typography variant="h6" color={"#fff"} mt={4}>
        Class Resources
      </Typography>
      {auth.userType == "teacher" && assignmentAttemptId ? (
        <Dropzone onDrop={handleFileDrop} />
      ) : (
        <Box></Box>
      )}

      {existing_resources.length === 0 ? (
        <Typography variant="body1" color={"#fff"} sx={{ mt: 4 }}>
          No class resources available.
        </Typography>
      ) : (
        existing_resources.map((resource, index) => (
          <Chip
            key={index}
            label={
              <Link
                href={resource.file}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                {resource.name}
              </Link>
            }
            onDelete={() => handleDeleteFile(resource.file)}
            sx={{
              margin: "0.5rem",
              width: "100%",
              justifyContent: "space-between",
            }}
            color="primary"
          />
        ))
      )}
      {selectedFiles.map((file, index) => (
        <Chip
          key={index}
          label={file.name}
          onDelete={() => handleRemoveFile(file)}
          color="secondary"
          sx={{
            margin: "0.5rem",
            width: "100%",
            justifyContent: "space-between",
            color: "secondary",
          }}
        />
      ))}
      {selectedFiles.length > 0 && (
        <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <Button
            onClick={handleSubmit}
            color="primary"
            variant="contained"
            sx={{
              marginTop: "1rem",
              width: 250,
              justifyContent: "center",
              alignItems: "center",
              gap: 1,
            }}
          >
            Upload {selectedFiles.length} File{selectedFiles.length > 1 && "s"}
            <FaUpload style={{ color: "#fff" }} />
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ClassResources;
