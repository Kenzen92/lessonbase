import React, { useState } from 'react';
import '../styles/StudentInfoCard.css';
import { Link, useNavigate } from 'react-router-dom';

const StudentInfoCard = ({ student, chatId }) => {
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const createChat = async () => {
        try {
            const auth = window.sessionStorage.getItem("Token");
            const response = await fetch('http://localhost:8000/chats/', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${auth}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ participants: [student.id] })
            });

            if (!response.ok) {
                throw new Error('Failed to create chat');
            }

            const data = await response.json();
            console.log("Data from create chat: ", data)
            // navigate(`/chat/${data.id}`);
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="student-info-card">
            <div className="student-info-card-content">
                <div className="student-info-card-info">
                    <p>ID: {student.id}</p>
                    <p>Username: {student.username}</p>
                    <p>First Name: {student.first_name}</p>
                    <p>Last Name: {student.last_name}</p>
                    <p>Enrollment Date: {student.enrollment_date}</p>
                    {chatId ? (
                        <Link to={`/chat/${chatId}`}>
                            <button className='chat-button'>Chat</button>
                        </Link>
                    ) : (
                        <button className='chat-button' onClick={createChat}>Create Chat</button>
                    )}
                </div>
            </div>
            {error && <p>{error}</p>}
        </div>
    );
}

export default StudentInfoCard;
