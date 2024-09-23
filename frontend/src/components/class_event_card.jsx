import React, { useState } from "react";
import "../styles/ClassEventCard.css";
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
import Dropzone from "./dropzone";
import { toast } from "react-toastify";
import ClassResources from "./class_resources";

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
  console.log("event data: ", eventData);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [homeworkModalOpen, setHomeworkModalOpen] = useState(false);

  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [filePurpose, setFilePurpose] = useState("");

  const startTime = new Date(eventData.start_time);

  const IconComponent = subjectIconMap[eventData.subject];

  const options = {
    hour: "numeric",
    minute: "numeric",
    hour12: false, // Use 24-hour clock
  };

  const timeFormatter = new Intl.DateTimeFormat("en-US", options);

  const formattedTime = timeFormatter.format(startTime);

  let studentsList = [];

  eventData.students.forEach((student, index) => {
    studentsList.push(
      <Avatar
        alt={student.username}
        src={student.profile_picture}
        className="student-profile-icon"
        key={index}
      >
        {student.username ? student.username[0] : null}
      </Avatar>
    );
  });

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

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("classID", eventData.id);
    if (description) formData.append("lesson_summary", description);
    if (file) {
      formData.append("file", file);
      if (filePurpose) formData.append("filePurpose", filePurpose);
    }
    console.log(formData);
    const auth = window.sessionStorage.getItem("token");
    fetch("http://localhost:8000/class_report", {
      method: "POST",
      headers: {
        Authorization: `Token ${auth}`,
      },
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        toast.success("File uploaded successfully!");
        console.log("Success:", data);
      })
      .catch((error) => {
        toast.error("Error uploading file.");
        console.error("Error:", error);
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

  return (
    <>
      <div>
        <Modal
          open={open}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={style} component="form" onSubmit={handleSubmit}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Class Content Submission
            </Typography>
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
              margin="normal"
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

        {/* Cancel Confirmation Dialog */}
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

        {/* Edit Class Modal */}
        <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)}>
          <Box sx={style}>
            <Typography variant="h6">Edit Class</Typography>
            <ScheduleClassBar classData={eventData} />
          </Box>
        </Modal>

        {/* Homework Modal */}
        <Modal
          open={homeworkModalOpen}
          onClose={() => setHomeworkModalOpen(false)}
        >
          <Box sx={style}>
            <Typography variant="h6">Homework</Typography>
            <p>Homework content goes here.</p>
          </Box>
        </Modal>
      </div>
      <div className="class-event-card">
        <div className="class-event-card-top">
          <div className="class-event-card-info">
            <div className="start-time">
              <FaClock className="class-clock-icon" />
              <h4>{formattedTime}</h4>
            </div>
            <div className="students-list">
              <FaGraduationCap className="student-icon" />
              <AvatarGroup max={3}>{studentsList}</AvatarGroup>
            </div>
            <div className="subject-section">
              <IconComponent className="subject-icon" />
              <h4 className="subject">{eventData.subject}</h4>
            </div>
          </div>
          <div className="class-event-card-actions-vertical">
            <button className="start-class-event">Start</button>
          </div>
        </div>
        <div className="class-event-card-bottom">
          {/* Resources Modal */}
          <ClassResources
            classId={eventData.id}
            existing_resources={eventData.resources}
            handleReloadData={handleReloadData}
          />
          <button
            className="view-homework-modal"
            onClick={() => setHomeworkModalOpen(true)}
          >
            Homework
          </button>
          <button
            className="edit-class-event"
            onClick={() => setEditModalOpen(true)}
          >
            Edit
          </button>
          <button
            className="cancel-class-event"
            onClick={() => setCancelConfirmOpen(true)}
          >
            Cancel
          </button>
        </div>
        {error && <p>{error}</p>}
      </div>
    </>
  );
};

export default ClassEventCard;
