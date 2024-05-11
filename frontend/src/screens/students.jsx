// Login.js
import React, { useState, useEffect } from 'react';
import Navigation from '../components/main_navigation';
import { toast } from 'react-toastify';
import '../styles/student.css'
import StudentInfoCard from '../components/student_info_card';

function Students() {
    const [showForm, setShowForm] = useState(false);
    const [students, setstudents] = useState([]);

    const fetchStudents = async () => {
        try {
            const auth = window.sessionStorage.getItem("Token");
            const response = await fetch('http://localhost:8000/students-for-teacher', {
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
            await setstudents(data);
            console.log(data)
        } catch (error) {
            setError(error.message);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    // Function to handle form submission
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setShowForm(!showForm);
        
        const url = 'http://localhost:8000/new-student/';
        const payload = {
            email: e.target.email.value
        };
        const auth = window.sessionStorage.getItem("Token");
        
        try {
            // Show a toast indicating that the email is being sent
            toast.promise(
                fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Token ${auth}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                }),
                {
                    pending: 'Sending email...',
                    success: 'Email sent successfully!',
                    error: 'Failed to send email. Please try again later.'
                }
            );
        } catch (error) {
            console.error(error);
            toast.error("Connection error. Please try again later.");
        }
    };

    return (
        <div className="App">
            <div>
                <Navigation />
                {showForm ? 
                    <form onSubmit={handleFormSubmit}>
                        <label>
                            Email:
                            <input type="email" name="email" required />
                        </label>
                        <button type="submit">Send Invitation</button>
                    </form>
                :
                <div>
                    <button onClick={() => setShowForm(!showForm)}>Add New Student</button>
                </div>
                }
                <div className="cards-section">
                {/* Iterate over each date key */}
                {students.map(student => (
                    <StudentInfoCard
                        key={student.id}
                        student={student}
                    />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Students;
