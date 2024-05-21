import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/main_navigation.css';
import { toast } from "react-toastify";
import handleUnauthorizedRequest from './unautherized_request';
import Avatar from '@mui/material/Avatar';


const Navigation = () => {

    const navigate = useNavigate();
    const [isHovering, setIsHovering] = useState(false);

    const handleAvatarClick = () => {
    history.push('/profile');
    };

    const handleMouseEnter = () => {
    setIsHovering(true);
    };

    const handleMouseLeave = () => {
    setIsHovering(false);
    };

    async function handleLogout() {
        const url = 'http://localhost:8000/logout/';
        const auth = window.sessionStorage.getItem("Token");
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${auth}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status == 401) {
                handleUnauthorizedRequest(navigate);
             }

            if (!response.ok) {
                toast.error("Couldn't logout")
                return;
            }

            await window.sessionStorage.removeItem("Token");
            navigate('/login');
        } catch (error) {
            console.log(error)
            toast.error("Connection error. Please try again later.")
        }
    };

    return (
        <>
            <div className="nav-container">
                <nav className='navigation'>
                    <ul className='navigation-list'>
                        <li>
                            <button className='nav-element'>
                                <Link to="/dashboard">Dashboard</Link>
                            </button>
                        </li>
                        <li>
                            <button className='nav-element'>
                                <Link to="/calendar">Calendar</Link>
                            </button>
                        </li>
                        <li>
                            <button className='nav-element'>
                                <Link to="/students">Students</Link>
                            </button>
                        </li>
                        <li>
                            <button className='nav-element'>
                                <Link to="/assignments">Assignments</Link>
                            </button>
                        </li>
                        <li>
                            <button className='nav-element'>
                                <Link to="/profile">Settings</Link>
                            </button>
                        </li>
                        <li>
                            <button className='nav-element' onClick={handleLogout}>
                                <Link to="/">Logout</Link>
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
            <div className="profile-bar">
                <div className="avatar-container">
                    <Avatar 
                        alt="Remy Sharp" 
                        src="https://images.ctfassets.net/h6goo9gw1hh6/2sNZtFAWOdP1lmQ33VwRN3/24e953b920a9cd0ff2e1d587742a2472/1-intro-photo-final.jpg?w=1200&h=992&fl=progressive&q=70&fm=jpg" 
                        className="profile-icon"
                        onClick={handleAvatarClick}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    />
                    {isHovering && (
                        <div className="hover-bubble">
                            <p>Remy Sharp</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default Navigation;
