import React, { useState } from "react";
import {
  FaDna,
  FaAtom,
  FaGlobe,
  FaCalculator,
  FaDesktop,
  FaLandmark,
  FaPalette,
  FaMusic,
  FaBalanceScaleLeft,
  FaBook,
  FaGraduationCap,
  FaClock,
} from "react-icons/fa";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import ScheduleClassBar from "./schedule_class_bar";
import { toast } from "react-toastify";
import ClassResources from "./class_resources";
import { motion } from "framer-motion";

const subjectIconMap = {
  Mathematics: FaCalculator,
  Physics: FaBalanceScaleLeft,
  Chemistry: FaAtom,
  Biology: FaDna,
  History: FaLandmark,
  Literature: FaBook,
  "Computer Science": FaDesktop,
  Art: FaPalette,
  Music: FaMusic,
  Geography: FaGlobe,
};

const ClassEventCard = ({ eventData, handleReloadData }) => {
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [homeworkModalOpen, setHomeworkModalOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [filePurpose, setFilePurpose] = useState("");

  const startTime = new Date(eventData.start_time);
  const currentTime = new Date();
  const isPastEvent = startTime < currentTime;
  const IconComponent = subjectIconMap[eventData.subject];

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const formattedTime = timeFormatter.format(startTime);

  let studentsList = eventData.students.map((student, index) => (
    <Avatar alt={student.username} src={student.profile_picture} key={index}>
      {student.username ? student.username[0] : null}
    </Avatar>
  ));

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("classID", eventData.id);
    if (description) formData.append("lesson_summary", description);
    if (file) {
      formData.append("file", file);
      if (filePurpose) formData.append("filePurpose", filePurpose);
    }

    const auth = window.sessionStorage.getItem("token");
    fetch("http://localhost:8000/class_report", {
      method: "POST",
      headers: {
        Authorization: `Token ${auth}`,
      },
      body: formData,
    })
      .then((response) => response.json())
      .then(() => {
        toast.success("File uploaded successfully!");
      })
      .catch(() => {
        toast.error("Error uploading file.");
      });
  };

  const handleConfirmCancel = async () => {
    try {
      const auth = window.sessionStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/class/${eventData.id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Token ${auth}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status === 204) {
        setError(null);
        handleReloadData();
      } else {
        throw new Error("Failed to delete class event");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setCancelConfirmOpen(false);
    }
  };

  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
    color: "black",
  };

  return (
    <>
      <Modal open={open}>
        <Box
          sx={{
            ...style,
          }}
          component="form"
          onSubmit={handleSubmit}
        >
          <Typography variant="h6">Class Content Submission</Typography>
          <TextField
            fullWidth
            margin="normal"
            label="Description"
            variant="outlined"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="file-purpose-label">File Purpose</InputLabel>
            <Select
              labelId="file-purpose-label"
              value={filePurpose}
              onChange={(e) => setFilePurpose(e.target.value)}
            >
              <MenuItem value="teaching">Teaching Material</MenuItem>
              <MenuItem value="homework">Homework</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => setResourcesModalOpen(true)}
          >
            Select File
          </Button>
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

      <Dialog
        open={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
      >
        <DialogTitle>Confirm Cancellation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this class event?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelConfirmOpen(false)}>No</Button>
          <Button onClick={handleConfirmCancel} color="secondary">
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <Box sx={{ ...style, width: 500 }}>
          <Typography variant="h6">Edit Class</Typography>
          <ScheduleClassBar classData={eventData} />
        </Box>
      </Modal>

      <Modal
        open={homeworkModalOpen}
        onClose={() => setHomeworkModalOpen(false)}
      >
        <Box sx={style}>
          <Typography variant="h6">Homework</Typography>
          <p>Homework content goes here.</p>
        </Box>
      </Modal>

      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Box
          sx={{
            p: 2,
            mb: 3,
            boxShadow: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            backgroundColor: "#292929",
            borderRadius: "15px",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "3rem",
            }}
          >
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <FaClock color="#fff" size={24} />
              <Typography>{formattedTime}</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <IconComponent color="#fff" size={24} />
              <Typography>{eventData.subject}</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <AvatarGroup max={3}>{studentsList}</AvatarGroup>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
            }}
          >
            {!isPastEvent && (
              <Button
                variant="contained"
                color="primary"
                sx={{ width: "8rem" }}
              >
                Start
              </Button>
            )}
            <Button
              variant="contained"
              color="secondary"
              sx={{ width: "8rem" }}
              onClick={() => setHomeworkModalOpen(true)}
            >
              Homework
            </Button>
            <Button
              variant="contained"
              color="secondary"
              sx={{ width: "8rem" }}
              onClick={() => setEditModalOpen(true)}
              disabled={isPastEvent}
            >
              Edit
            </Button>
            <ClassResources
              classId={eventData.id}
              existing_resources={eventData.resources}
              handleReloadData={handleReloadData}
            />
            <Button
              variant="contained"
              color="error"
              sx={{ width: "8rem" }}
              onClick={() => setCancelConfirmOpen(true)}
              disabled={isPastEvent}
            >
              Cancel
            </Button>
          </Box>
          {error && <Typography color="error">{error}</Typography>}
        </Box>
      </motion.div>
    </>
  );
};

export default ClassEventCard;
