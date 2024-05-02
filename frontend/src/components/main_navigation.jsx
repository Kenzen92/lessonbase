import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/main_navigation.css'

const Navigation = () => {
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
                    <Link className='nav-element' to="/my-students">My Students</Link>
                </li>
                <li>
                    <Link className='nav-element' to="/assignments">Assignments</Link>
                </li>
                <li>
                    <Link className='nav-element' to="/profile">Settings / Profile</Link>
                </li>
            </ul>
        </nav>
    );
}

export default Navigation;
