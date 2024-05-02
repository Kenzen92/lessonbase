// Login.js
import React, { useState, useEffect } from 'react';
import { Link, Router, useNavigate } from 'react-router-dom';

import Navigation from '../components/main_navigation';
import '../styles/profile.css'


function Profile() {
    const [profileData, setProfileData] = useState(null);
    const [error, setError] = useState(null);

    // Define fetchClassEvents function
    const fetchProfileData = async () => {
        try {
            const auth = window.sessionStorage.getItem("Token");
            const response = await fetch('http://localhost:8000/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${auth}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch class events');
            }

            const data = await response.json();
            console.log(data)
            setProfileData(data);
        } catch (error) {
            setError(error.message);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    // Callback function to force re-render of ClassDashboard after item deletion
    const handleReloadData = () => {
        console.log("Handling");
        // Call  to fetch updated data
        fetchProfileData();
    };

    // Function to handle changes in form fields
    const handleChange = (event) => {
        const { name, value } = event.target;
        setProfileData({
            ...profileData,
            [name]: value
        });
    };

    // Function to handle form submission
    const handleSubmit = async (event) => {
    event.preventDefault();
    const url = 'http://localhost:8000/profile/';
    // Construct the class object to be submitted

    try {
        const auth = window.sessionStorage.getItem("Token");
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });

        const data = await response.json();
        console.log(data)
    } catch (error) {
        console.log('Error: ' + error.message);
    }

    // Here you can send the newClass object to your backend or perform other actions
    console.log('Submitted profile: ', profileData);
    // Close the modal after submission
    handleReloadData();
    };

    return (
        <div className="Profile">
            <div>
                <Navigation />
            </div>
            <div className='form-container'>
                {profileData ? 
                <form className="profile-form" onSubmit={handleSubmit}>
                    <label htmlFor="username">Username:</label>
                    <input type="text" id="username" name="username" value={profileData['username']} onChange={handleChange} />

                    <label htmlFor="subjects">Subjects:</label>
                    <ul>
                        {profileData.subjects.map((subject, index) => (
                            <li key={index}>
                                <input type="text" value={subject.name} readOnly />
                            </li>
                        ))}
                    </ul>

                    <label htmlFor="first_name">First Name:</label>
                    <input type="text" id="first_name" name="first_name" value={profileData['first_name']} onChange={handleChange} />

                    <label htmlFor="last_name">Last Name:</label>
                    <input type="text" id="last_name" name="last_name" value={profileData['last_name']} onChange={handleChange} />

                    <label htmlFor="email">Email:</label>
                    <input type="email" id="email" name="email" value={profileData['email']} onChange={handleChange}/>

                    <button type="submit">Submit</button>
                </form>
                :
                <div><p>Loading...</p></div>
                    }
            </div>
        </div>
    );
}

export default Profile;