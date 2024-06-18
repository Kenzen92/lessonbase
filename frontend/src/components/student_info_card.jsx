import React, { useState } from 'react';
import '../styles/StudentInfoCard.css';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';

const StudentInfoCard = ({ student, chatId }) => {
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const createChat = async () => {
        try {
            const auth = window.sessionStorage.getItem("token");
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
            navigate(`/chat/${data.id}`);
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="student-info-card">
            <div className="student-info-card-content">
                <div className="student-info-card-info">
                    <div className="username-picture-row">
                        <div>{student.username}</div>
                        <Avatar 
                        alt={student.username} 
                        src={student.profile_picture} 
                        className="student-profile-icon"
                        >
                            {student.username? student.username[0] : null}  
                        </Avatar>
                    </div>
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
