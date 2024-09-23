import React, { useState } from "react";
import { Modal, Box, Typography, Button, Link } from "@mui/material";
import Dropzone from "./dropzone";
import { toast } from "react-toastify";

const ClassResources = ({ classId, existing_resources, handleReloadData }) => {
  const [resourcesModalOpen, setResourcesModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
    color: "black",
  };

  const handleFileDrop = (files) => {
    setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
  };

  const handleRemoveFile = (fileToRemove) => {
    setSelectedFiles((prevFiles) =>
      prevFiles.filter((file) => file !== fileToRemove)
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData();

    // Append selected files to form data
    selectedFiles.forEach((file) => {
      formData.append("file", file);
    });

    // Hardcoded class ID for now
    formData.append("class_id", classId);
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
        setResourcesModalOpen(false);
        handleReloadData();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  return (
    <>
      <Modal
        open={resourcesModalOpen}
        onClose={() => setResourcesModalOpen(false)}
      >
        <Box sx={style} component="form" onSubmit={handleSubmit}>
          <Typography variant="h6">Upload Resources </Typography>
          <Dropzone onDrop={handleFileDrop} />
          {existing_resources.map((resource, index) => (
            <Typography key={index} variant="body1">
              <Link
                href={resource.file}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: "black",
                  background: "none",
                  fontSize: "larger",
                }}
              >
                {resource.name}
              </Link>
            </Typography>
          ))}
          {selectedFiles.map((file, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                alignItems: "center",
                marginTop: "0.5rem",
              }}
            >
              <Typography variant="h8" sx={{ flexGrow: 1 }}>
                {file.name}
              </Typography>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => handleRemoveFile(file)}
              >
                Remove
              </Button>
            </Box>
          ))}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
          >
            Submit
          </Button>
        </Box>
      </Modal>
      <button
        className="view-resource-modal"
        onClick={() => setResourcesModalOpen(true)}
      >
        Resources{" "}
        {existing_resources.length > 0
          ? `(${existing_resources.length})`
          : null}
      </button>
    </>
  );
};

export default ClassResources;
