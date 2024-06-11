import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/main_navigation.css';
import { toast } from "react-toastify";
import handleUnauthorizedRequest from './unautherized_request';
import Avatar from '@mui/material/Avatar';


const Navigation = () => {

    const navigate = useNavigate();
    const [isHovering, setIsHovering] = useState(false);
    const [userProfileURL, setProfileURL] = useState(null);
    const [userName, setName] = useState(null);

    const handleAvatarClick = () => {
    navigate('/profile');
    };

    const handleMouseEnter = () => {
    setIsHovering(true);
    };

    const handleMouseLeave = () => {
    setIsHovering(false);
    };

    const loadUserData = () => {
        const userData = window.sessionStorage.getItem("user")

        if (userData) {
            // Parse the JSON string to get the JavaScript object
            const user = JSON.parse(userData);
            setName(user.first_name);
            setProfileURL(user.profile_picture_url);
        }
    }

    // useEffect to call loadUserData when the component mounts
    useEffect(() => {
        loadUserData();
    }, []); // Empty dependency array means this runs once on mount


    async function handleLogout() {
        const url = 'http://localhost:8000/logout/';
        const auth = window.sessionStorage.getItem("token");
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
                            <Link to="/dashboard">
                                <button className='nav-element'>Dashboard</button>
                            </Link>
                        </li>
                        <li>
                            <Link to="/calendar">
                                <button className='nav-element'>Calendar</button>
                            </Link>
                        </li>
                        <li>
                            <Link to="/students">
                                <button className='nav-element'>Students</button>
                            </Link>
                        </li>
                        <li>
                            <Link to="/assignments">
                                <button className='nav-element'>Assignments</button>
                            </Link>
                        </li>
                        <li>
                            <Link to="/profile">
                            <button className='nav-element'>Settings</button>
                            </Link>
                            
                        </li>
                        <li>
                            <Link to="/">
                                <button className='nav-element' onClick={handleLogout}>Logout</button>
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
            <div className="profile-bar">
                <div className="avatar-container">
                    <Avatar 
                        alt={userName} 
                        src={userProfileURL} 
                        className="profile-icon"
                        onClick={handleAvatarClick}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        {userName[0]}
                    </Avatar>
                    {isHovering && (
                        <div className="hover-bubble">
                            <p>{userName}</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default Navigation;
