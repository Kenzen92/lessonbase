// Login.js
import React, { useState, useEffect } from 'react';
import Navigation from '../components/main_navigation';
import { toast } from 'react-toastify';
import '../styles/dashboard.css'
import '../styles/student.css'
import StudentInfoCard from '../components/student_info_card';

function Students() {
    const [showForm, setShowForm] = useState(false);
    const [students, setstudents] = useState([]);
    const [chats, setChats] = useState([])
    const currentUserID = 1; // Hardcoded for now, replace with dynamic user ID later

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

    const fetchChats = async () => {
        try {
            const auth = window.sessionStorage.getItem("Token");
            const response = await fetch('http://localhost:8000/chats', {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${auth}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch chats');
            }

            const data = await response.json();
            const processedChats = data.map(chat => {
                return {
                    ...chat,
                    participants: chat.participants.filter(id => id !== currentUserID)
                };
            });
            setChats(processedChats);
        } catch (error) {
            console.error(error.message);
        }
    };

    useEffect(() => {
        fetchStudents();
        fetchChats();
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
            <>
                <Navigation />
                <div className="student-container">
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
                    {students.map(student => {
                        const chat = chats.find(chat => chat.participants.includes(student.id));
                        const chatId = chat ? chat.id : null;

                        return (
                            <StudentInfoCard
                                key={student.id}
                                student={student}
                                chatId={chatId} // Pass the chat ID to the student card
                            />
                        );
                    })}
                    </div>
                </div>
            </>
    );
}

export default Students;
