import React, { useState, useEffect } from 'react';
import '../styles/ClassEventCard.css'
import { Link, Router, useNavigate } from 'react-router-dom';
import { FaDna, FaAtom, FaGlobe, FaCalculator, FaDesktop, FaLandmark, FaPalette, FaMusic, FaBalanceScaleLeft, FaBook, FaGraduationCap } from 'react-icons/fa';
import { Modal, Box, Typography, TextField, Button, MenuItem, Select, InputLabel, FormControl } from '@mui/material';

const subjectIconMap = {
    'Mathematics': FaCalculator,
    'Physics': FaBalanceScaleLeft,
    'Chemistry': FaAtom,
    'Biology': FaDna,
    'History': FaLandmark,
    'Literature': FaBook,
    'Computer Science': FaDesktop,
    'Art': FaPalette,
    'Music': FaMusic,
    'Geography': FaGlobe,
};

const ClassEventCard = ({ eventData, handleReloadData }) => {
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [filePurpose, setFilePurpose] = useState('');

    const navigate = useNavigate();
    // Convert the start_time string to a Date object
    const startTime = new Date(eventData.start_time);

    const IconComponent = subjectIconMap[eventData.subject]

    // Define options for formatting time
    const options = {
        hour: 'numeric',
        minute: 'numeric',
        hour12: false // Use 24-hour clock
    };
    // Create a formatter instance using Intl.DateTimeFormat
    const timeFormatter = new Intl.DateTimeFormat('en-US', options);

    // Format the datetime to just the time
    const formattedTime = timeFormatter.format(startTime);
    
    let studentsList = [];

    eventData.students.forEach((student, index) => {
        studentsList.push(<li key={index}>{student.username}</li>);
    });



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

    

    const handleEditClick = () => {
        console.log("edit");
    };

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append('classID', eventData.id)
        if (description) formData.append('lesson_summary', description);
        if (file) {
            formData.append('file', file);
            if (filePurpose) formData.append('filePurpose', filePurpose);
        }
        console.log(formData)
        const auth = window.sessionStorage.getItem("token");
        fetch('http://localhost:8000/class_report', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${auth}`,
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            handleClose(); // Close the modal on success
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    };


    const handleCancelClick = async (eventID) => {
        try {
            const auth = window.sessionStorage.getItem("token");
            const response = await fetch(`http://localhost:8000/class/${eventID}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Token ${auth}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.status === 204) {
                setError(null);
                handleReloadData();
            } else {
                // Error
                throw new Error('Failed to delete class event');
            }
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <>
            <div>
                <Modal
                open={open}
                onClose={handleClose}
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
                        component="label"
                        fullWidth
                        margin="normal"
                    >
                        Upload File
                        <input
                            type="file"
                            hidden
                            onChange={handleFileChange}
                        />
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
            </div>
        <div className="class-event-card">
            <div className="class-event-card-content">
                <div className="class-event-card-info">
                    <p className="start-time">{formattedTime}</p>
                    <div className="students-list">
                        <FaGraduationCap className="student-icon"/>
                        <ul>{studentsList}</ul>
                    </div>
                    <div className='subject-section'>
                        <IconComponent className="subject-icon"/>
                        <h4 className="subject">{eventData.subject}</h4> 
                    </div>

                </div>
                
                <div className="class-event-card-actions">
                    <button className="start-class-event" onClick={handleOpen}>START</button>
                    <button className="edit-class-event" onClick={handleEditClick}>EDIT</button>
                    <button className="cancel-class-event" onClick={() => handleCancelClick(eventData.id)}>CANCEL</button>

                </div>
                
            </div>
            {error && <p>{error}</p>}
        </div>
        </>
    );
}

export default ClassEventCard;