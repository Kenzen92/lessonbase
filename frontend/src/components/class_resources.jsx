import React, { useState } from "react";
import { Box, Typography, Button, Link } from "@mui/material";
import Dropzone from "./dropzone";
import { toast } from "react-toastify";

const ClassResources = ({ classId, existing_resources, handleReloadData }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileDrop = (files) => {
    setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
  };

  const handleRemoveFile = (fileToRemove) => {
    setSelectedFiles((prevFiles) =>
      prevFiles.filter((file) => file !== fileToRemove)
    );
  };

  const handleDeleteFile = (resourceURL) => {
    const auth = window.sessionStorage.getItem("token");
    const deleteBody = JSON.stringify({ file_url: resourceURL });
  
    fetch("http://localhost:8000/class_material", {
      method: "DELETE",
      headers: {
        Authorization: `Token ${auth}`,
        "Content-Type": "application/json",
      },
      body: deleteBody,
    })
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
  

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData();

    // Append selected files to form data
    selectedFiles.forEach((file) => {
      formData.append("file", file);
    });

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
        handleReloadData();
      })
      .catch((error) => {
        console.error("Error:", error);
        toast.error("An error occurred while uploading resources");
      });
  };

  return (
    <Box>
      <Typography variant="h6" color={'#fff'}>Upload Resources</Typography>
      <Dropzone onDrop={handleFileDrop} />
      {existing_resources.map((resource, index) => (
        <Box key={index} sx={{ display: "flex", alignItems: "center", marginTop: "0.5rem" }}>
          <Typography variant="body1" color={'#fff'} sx={{ flexGrow: 1 }}>
            <Link
              href={resource.file}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: "#fff", fontSize: "larger" }}
            >
              {resource.name}
            </Link>
          </Typography>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => handleDeleteFile(resource.file)}
          >
            Remove
          </Button>
        </Box>
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
          <Typography variant="body2" color={'#fff'} sx={{ flexGrow: 1 }}>
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
        onClick={handleSubmit}
      >
        Submit
      </Button>
    </Box>
  );
};

export default ClassResources;
