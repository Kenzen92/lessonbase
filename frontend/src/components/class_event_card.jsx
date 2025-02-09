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
  FaClock,
} from "react-icons/fa";
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import ScheduleClassBar from "./schedule_class_bar";
import { toast } from "react-toastify";
import ClassResources from "./class_resources";
import { motion } from "framer-motion";
import { cancelClassEvent } from "../utils/agent";

const subjectIDMap = {
  Mathematics: 1,
  Physics: 2,
  Chemistry: 3,
  Biology: 4,
  History: 5,
  Literature: 6,
  "Computer Science": 7,
  Art: 8,
  Music: 9,
  Geography: 10,
};

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

const TabPanel = ({ children, value, index }) => (
  <Box hidden={value !== index} sx={{ p: 3 }}>
    {value === index && children}
  </Box>
);

const ClassEventCard = ({ eventData, handleReloadData }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [filePurpose, setFilePurpose] = useState("");
  const [error, setError] = useState(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const startTime = new Date(eventData.start_time);
  const currentTime = new Date();
  const isPastEvent = startTime < currentTime;
  const subjectName = Object.keys(subjectIDMap).find(
    (key) => subjectIDMap[key] === eventData.subject
  );
  const IconComponent = subjectIconMap[subjectName];

  const formattedTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).format(startTime);

  let studentsList = eventData.students.map((student, index) => (
    <Avatar alt={student.username} src={student.profile_picture} key={index}>
      {student.username ? student.username[0] : null}
    </Avatar>
  ));

  const handleTabChange = (event, newIndex) => {
    setTabIndex(newIndex);
  };

  const handleStartClass = () => {
    console.log("starting class");
  };

  const handleConfirmCancelClassEvent = async () => {
    try {
      const response = await cancelClassEvent(eventData.id);

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
          <Button onClick={handleConfirmCancelClassEvent} color="secondary">
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>
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
            width: "40rem",
            height: "27rem",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <FaClock color="#fff" size={24} />
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Typography sx={{ fontWeight: "bold", fontSize: "larger" }}>
                  {formattedTime}
                </Typography>
                <Typography>{eventData.duration} Minutes</Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <IconComponent color="#fff" size={24} />
              <Typography>{subjectName}</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <AvatarGroup max={3}>{studentsList}</AvatarGroup>
            </Box>
          </Box>

          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            textColor="secondary"
            indicatorColor="secondary"
            aria-label="class event tabs"
          >
            <Tab label="Homework" />
            <Tab label="Resources" />
            <Tab label="Edit Class" />
          </Tabs>

          <TabPanel value={tabIndex} index={0}>
            <Box sx={{ height: "11rem" }}>
              <Typography variant="h6">Homework</Typography>
              <p>Homework content goes here.</p>
            </Box>
          </TabPanel>

          <TabPanel value={tabIndex} index={1}>
            <Box sx={{ height: "11rem" }}>
              <ClassResources
                classId={eventData.id}
                existing_resources={eventData.resources}
                handleReloadData={handleReloadData}
              />
            </Box>
          </TabPanel>

          <TabPanel value={tabIndex} index={2}>
            <Box sx={{ height: "11rem" }}>
              <Typography variant="h6" color="#fff">
                Edit Class
              </Typography>
              <ScheduleClassBar classData={eventData} />
            </Box>
          </TabPanel>

          {error && <Typography color="error">{error}</Typography>}
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Button onClick={() => setCancelConfirmOpen(true)}>
              <Typography>Cancel</Typography>
            </Button>
            <Button onClick={() => handleStartClass()}>
              <Typography>Start</Typography>
            </Button>
          </Box>
        </Box>
      </motion.div>
    </>
  );
};

export default ClassEventCard;
