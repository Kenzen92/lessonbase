import React, { useState, useEffect } from 'react';
import '../styles/StudentInfoCard.css'
import { Link, Router, useNavigate } from 'react-router-dom';

const StudentInfoCard = ({ student }) => {
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    return (
        <div className="student-info-card">
            <div className="student-info-card-content">
                <div className="student-info-card-info">
                    <p>ID: {student.id}</p>
                    <p>Username: {student.username}</p>
                    <p>First Name: {student.first_name}</p>
                    <p>Last Name: {student.last_name}</p>
                    <p>Enrollment Date: {student.enrollment_date}</p>
                </div>
                
            </div>
            {error && <p>{error}</p>}
        </div>
    );
}

export default StudentInfoCard;