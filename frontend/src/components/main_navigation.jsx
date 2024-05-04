import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/main_navigation.css';
import { toast } from "react-toastify";
import handleUnauthorizedRequest from './unautherized_request';

const Navigation = () => {

    const navigate = useNavigate();

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
        <nav className='navigation'>
            <ul>
                <li>
                    <Link className='nav-element' to="/dashboard">Dashboard</Link>
                </li>
                <li>
                    <Link className='nav-element' to="/calendar">Calendar</Link>
                </li>
                <li>
                    <Link className='nav-element' to="/students">Students</Link>
                </li>
                <li>
                    <Link className='nav-element' to="/assignments">Assignments</Link>
                </li>
                <li>
                    <Link className='nav-element' to="/profile">Settings / Profile</Link>
                </li>
                <li>
                    <Link className='nav-element' onClick={handleLogout}>Logout</Link>
                </li>
            </ul>
        </nav>
    );
}

export default Navigation;
