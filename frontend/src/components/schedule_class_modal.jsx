import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/schedule_class_modal.css';
import handleUnauthorizedRequest from './unautherized_request';
import { toast } from 'react-toastify';

const ScheduleClassModal = ({handleReloadData}) => {
    const [showing, setShowing] = useState(false);
    const [startTime, setStartTime] = useState('');
    const [duration, setDuration] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [allStudents, setAllStudents] = useState([]);
    const [allSubjects, setAllSubjects] = useState([]);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const toggleModal = () => {
        setShowing(!showing);
    };

    // Define fetchClassEvents function
    const fetchStudents = async () => {
        try {
            const auth = window.sessionStorage.getItem("Token");
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
            const auth = window.sessionStorage.getItem("Token");
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
        const selectedSubjectObj = allSubjects.find(subject => subject.id === parseInt(selectedSubject));
        const newClass = {
            start_time: startTime,
            duration: duration,
            students: selectedStudents,
            subject: selectedSubjectObj
        };


        try {
            const auth = window.sessionStorage.getItem("Token");
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
    
    
    

    return (
        <div>
            {showing ? (
                <>
                <div className="schedule-class-modal-inactive"> </div>
                <div className="schedule-class-overlay">
                    <div className="schedule-class-modal">
                        <button className="close-modal" onClick={toggleModal}>
                            Close
                        </button>
                        <form className="schedule-class-form" onSubmit={handleSubmit}>
                            <label className="form-label "htmlFor="start_time">Start Time:</label>
                            <input
                                type="datetime-local"
                                id="start_time"
                                value={startTime}
                                min={new Date().toISOString().slice(0, 16)}  // Minimum allowed datetime is current datetime
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                                className="form-input"
                            />

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
                    </div>
                </div>
                </>
            ) : (
                <div className="schedule-class-modal-inactive">
                    <button className="new-class-button" onClick={toggleModal}>
                        New Class
                    </button>
                </div>
            )}
        </div>

    );
};

export default ScheduleClassModal;
