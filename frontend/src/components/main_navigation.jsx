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
                        <Link to="/profile">Settings / Profile</Link>
                    </button>
                </li>
                <li>
                    <button className='nav-element' onClick={handleLogout}>
                        <Link to="/">Logout</Link>
                    </button>
                </li>
            </ul>
        </nav>
    );
}

export default Navigation;
