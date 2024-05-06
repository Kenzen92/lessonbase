// Login.js
import React, { useState } from 'react';
import { Link, Router, useNavigate } from 'react-router-dom';
import Navigation from '../components/main_navigation';
import { toast } from 'react-toastify';
import '../styles/student.css'

function Students() {
    const [showForm, setShowForm] = useState(false);

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
            </div>
        </div>
    );
}

export default Students;
