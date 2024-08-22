// Login.js
import React, { useState, useEffect } from 'react';
import Navigation from '../components/main_navigation';
import { toast } from 'react-toastify';
import '../styles/dashboard.css'
import '../styles/assignments.css'


function Assignments() {
    const [showForm, setShowForm] = useState(false);
    const [students, setstudents] = useState([]);
    const [chats, setChats] = useState([])
    const currentUserID = 1; // Hardcoded for now, replace with dynamic user ID later


    const fetchAssignments = async () => {
        // try {
        //     const auth = window.sessionStorage.getItem("token");
        //     const response = await fetch('http://localhost:8000/chats', {
        //         method: 'GET',
        //         headers: {
        //             'Authorization': `Token ${auth}`,
        //             'Content-Type': 'application/json'
        //         }
        //     });

        //     if (!response.ok) {
        //         throw new Error('Failed to fetch chats');
        //     }

        //     const data = await response.json();
        //     const processedChats = data.map(chat => {
        //         return {
        //             ...chat,
        //             participants: chat.participants.filter(id => id !== currentUserID)
        //         };
        //     });
        //     setChats(processedChats);
        // } catch (error) {
        //     console.error(error.message);
        // }
    };

    useEffect(() => {
        fetchAssignments();
    }, []);

    // Function to handle form submission
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setShowForm(!showForm);
        
        const url = 'http://localhost:8000/new-student/';
        const payload = {
            email: e.target.email.value
        };
        const auth = window.sessionStorage.getItem("token");
        
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
                <div className="assignment-container"></div>
            </>
    );
}

export default Assignments;
