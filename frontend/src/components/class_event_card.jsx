import React, { useState, useEffect } from 'react';
import '../styles/ClassEventCard.css'
import { Link, Router, useNavigate } from 'react-router-dom';

const ClassEventCard = ({ eventData, handleReloadData }) => {
    const [error, setError] = useState(null);
    console.log(eventData);
    const navigate = useNavigate();
    // Convert the start_time string to a Date object
    const startTime = new Date(eventData.start_time);

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
    
    let teachersList = [];

    eventData.teachers.forEach((teacher, index) => {
        teachersList.push(<li key={index}>{teacher.username}</li>);
    });

    let studentsList = [];

    eventData.students.forEach((student, index) => {
        studentsList.push(<li key={index}>{student.username}</li>);
    });

    const handleStartClick = () => {
        console.log("start");
    };

    const handleEditClick = () => {
        console.log("edit");
    };

    const handleCancelClick = async (eventID) => {
        try {
            const auth = window.sessionStorage.getItem("Token");
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
        <div className="class-event-card">
            <div className="class-event-card-content">
                <div className="class-event-card-info">
                    <p className="start-time">{formattedTime}</p>
                    <div className="students-list">
                        <h3>Students:</h3>
                        <ul>{studentsList}</ul>
                    </div>
                    <div className="teachers-list">
                        <h3>Teachers:</h3>
                        <ul>{teachersList}</ul>
                    </div>
                    <p className="subject">{eventData.subject}</p> 
                </div>
                
                <div className="class-event-card-actions">
                    <div className="start-class-event" onClick={handleStartClick}>START</div>
                    <div className="edit-class-event" onClick={handleEditClick}>EDIT</div>
                    <div className="cancel-class-event" onClick={() => handleCancelClick(eventData.id)}>CANCEL</div>

                </div>
                
            </div>
            {error && <p>{error}</p>}
        </div>
    );
}

export default ClassEventCard;