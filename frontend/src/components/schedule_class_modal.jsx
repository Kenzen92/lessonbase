import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/schedule_class_modal.css';
import { toast } from 'react-toastify';
import BasicDateTimePicker from './dateTimePicker'
import BasicTimePicker from './timePicker'
import { Box, Modal, Button, Typography, FormControl, InputLabel, Input, Select, MenuItem } from '@mui/material';

const ScheduleClassModal = ({handleReloadData}) => {
    const [startTime, setStartTime] = useState('');
    const [duration, setDuration] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [allStudents, setAllStudents] = useState([]);
    const [allSubjects, setAllSubjects] = useState([]);
    const [error, setError] = useState(null);
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const navigate = useNavigate();
    const toggleModal = () => {
        setShowing(!showing);
    };

    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
      };

    // Define fetchClassEvents function
    const fetchStudents = async () => {
        try {
            const auth = window.sessionStorage.getItem("token");
            const response = await fetch('http://localhost:8000/students', {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${auth}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status == 401) {
                handleUnautherizedRequest(navigate);
             }

            if (!response.ok) {
                throw new Error('Failed to fetch students');
            }

            const data = await response.json();
            setAllStudents(data);
        } catch (error) {
            setError(error.message);
        }
    };

    const fetchSubjects = async () => {
        try {
            const auth = window.sessionStorage.getItem("token");
            const response = await fetch('http://localhost:8000/subjects', {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${auth}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch subjects');
            }

            const data = await response.json();
            setAllSubjects(data);
        } catch (error) {
            setError(error.message);
        }
    };

    useEffect(() => {
        const now = new Date().toISOString().slice(0, 16);
        setStartTime(now);
        fetchStudents();
        fetchSubjects();
    }, []);



    // Function to handle form submission
    const handleSubmit = async (event) => {
        event.preventDefault();
        const url = 'http://localhost:8000/class/';
        // Construct the class object to be submitted

        // Find the subject object corresponding to the selectedSubject ID
        console.log(selectedSubject)
        
        const selectedSubjectObj = allSubjects.find(subject => subject.id === parseInt(selectedSubject));
        console.log(selectedSubjectObj)
        const newClass = {
            start_time: startTime,
            duration: duration,
            students: selectedStudents,
            subject: selectedSubjectObj['name']
        };
        console.log(newClass)

        try {
            const auth = window.sessionStorage.getItem("token");
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${auth}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newClass)
            });

            const data = await response.json();
            console.log(data)
        } catch (error) {
            console.log('Error: ' + error.message);
        }
    
        // Close the modal after submission
        toast.success("The class event was scheduled")
        handleReloadData();
        toggleModal();

    };

    const studentSelector = () => {
    
        return (
            <select
                id="students"
                multiple
                value={selectedStudents}
                onChange={(e) => setSelectedStudents(Array.from(e.target.selectedOptions, (option) => option.value))}
                required
                className="form-input"
            >
                {allStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                        {student.username}
                    </option>
                ))}
            </select>
        );
    };

    const subjectSelector = () => {
        return (
            <select
                id="subjects"
                value={selectedSubject}  // Assuming selectedSubject is the ID
                onChange={(e) => setSelectedSubject(e.target.value)}  // Set only the ID as the value
                required
                className="form-input"
            >
                {allSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                        {subject.name}
                    </option>
                ))}
            </select>
        );
    };

    const handleDurationChange = (event) => {
        setDuration(event.target.value);
    };
    
    
    return (
        <div>
            <button onClick={handleOpen}>Schedule Class</button>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <Button onClick={handleClose}>
                        Close
                    </Button>
                    <FormControl>
                        <BasicDateTimePicker 
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            label="Date"
                        />
                        <BasicTimePicker 
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            label="Time"
                        />
                        <FormControl>
                            <InputLabel htmlFor="duration-input">Duration</InputLabel>
                            <Select
                                id="duration-select"
                                value={duration}
                                onChange={handleDurationChange}
                            >
                                <MenuItem value={0}>0 minutes</MenuItem>
                                <MenuItem value={15}>15 minutes</MenuItem>
                                <MenuItem value={30}>30 minutes</MenuItem>
                                <MenuItem value={45}>45 minutes</MenuItem>
                                <MenuItem value={60}>60 minutes</MenuItem>
                                <MenuItem value={75}>75 minutes</MenuItem>
                                <MenuItem value={90}>90 minutes</MenuItem>
                            </Select>
                        </FormControl>
                    </FormControl>
                        {/* <form className="schedule-class-form" onSubmit={handleSubmit}>
                          

                            <label className="form-label" htmlFor="duration">Duration (minutes):</label>
                            <input
                                type="number"
                                id="duration"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                required
                                className="form-input"
                            />

                            <label className="form-label" htmlFor="students">Select Students:</label>
                            {studentSelector()}

                            <label className="form-label" htmlFor="subject">Select Subject:</label>
                            {subjectSelector()}

                            <button type="submit">Schedule Class</button>
                        </form>
                    </div> */}
                <Typography id="modal-modal-title" variant="h6" component="h2" sx={{color: 'black'}}>
                    Text in a modal
                </Typography>
                <Typography id="modal-modal-description" sx={{ color: 'black', mt: 2 }}>
                    Duis mollis, est non commodo luctus, nisi erat porttitor ligula.
                </Typography>
                </Box>
            </Modal>
            {/* {showing ? (
                <>
                <div className="schedule-class-modal-inactive"> </div>
                <div className="schedule-class-overlay">
                    
                </div>
                </>
            ) : (
                <div className="schedule-class-modal-inactive">
                    <button className="new-class-button" onClick={toggleModal}>
                        New Class
                    </button>
                </div>
            )} */}
        </div>

    );
};

export default ScheduleClassModal;
