// Login.js
import React, { useState, useEffect } from 'react';
import Navigation from '../components/main_navigation';
import '../styles/profile.css'
import Select from 'react-select'
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function Profile() {
    const [profileData, setProfileData] = useState(null);
    const [error, setError] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [profilePicture, setProfilePicture] = useState(null);
    const navigate = useNavigate();

    // Define fetchClassEvents function
    const fetchProfileData = async () => {
        try {
            const auth = window.sessionStorage.getItem("token");
            const response = await fetch('http://localhost:8000/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${auth}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status == 401) {
                handleUnautherizedRequest(navigate);
             }

            if (!response.ok) {
                throw new Error('Failed to fetch class events');
            }

            const data = await response.json();
            let profile_subjects = data['subjects'];
            let profile_subjects_for_list = []
            for (let subject of profile_subjects) {
                const subject_option = { value: subject.id, label: subject.name };
                profile_subjects_for_list.push(subject_option);
            }
            console.log(profile_subjects_for_list)
            await setSelectedSubjects(profile_subjects_for_list);
            console.log(selectedSubjects);
            setProfileData(data);
        } catch (error) {
            setError(error.message);
        }
    };

    
    const fetchSubjects = async () => {
        try {
            const auth = window.sessionStorage.getItem("token");
            const response = await fetch('http://localhost:8000/subjects/all', {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${auth}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch subjects');
            }

            const data = await response.json();
            let subject_options = []
            for (let subject of data) {
                const subject_option = { value: subject.id, label: subject.name };
                subject_options.push(subject_option);
            }
            setSubjects(subject_options);
        } catch (error) {
            setError(error.message);
        }
    };

    useEffect(() => {
        fetchProfileData();
        fetchSubjects();
    }, []);


    const handleReloadData = () => {
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

    const handleFileChange = (event) => {
        setProfilePicture(event.target.files[0]);
    };

   // Function to handle form submission
    const handleSubmit = async (event) => {
    event.preventDefault();
    const url = 'http://localhost:8000/profile/';
    // Create a FormData object to handle file upload
    const formData = new FormData();
    formData.append('username', profileData.username);
    formData.append('first_name', profileData.first_name);
    formData.append('last_name', profileData.last_name);
    formData.append('email', profileData.email);
    if (profilePicture) {
        formData.append('profile_picture', profilePicture);
    }
    try {
        const auth = window.sessionStorage.getItem("token");
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${auth}`,
            },
            body: formData
        });

        if (!response.ok) {
            console.error('Network response was not ok.');
            return;
        }
        const data = await response.json();
        const newURL = data['profile_picture'];
        if (!newURL) {
            console.error('No new profile picture URL in response.');
            return;
        }

        let userData = await JSON.parse(window.sessionStorage.getItem("user"));

        if (!userData) {
            console.error('No user data found in session storage.');
            return;
        }

        userData['profile_picture'] = newURL;

        await window.sessionStorage.setItem("user", JSON.stringify(userData));
        console.log('User data updated in session storage.');
    } catch (error) {
        console.error('Error:', error.message);
    }

    const subject_url = 'http://localhost:8000/subjects/';
    const subject_data = selectedSubjects.map(entry => entry.value);
    const data_to_send = {"subjects": subject_data}
    try {
        const auth = window.sessionStorage.getItem("token");
        const response = await fetch(subject_url, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data_to_send)
        });

        const data = await response.json();
        console.log(data)
    } catch (error) {
        console.log('Error: ' + error.message);
    }

    handleReloadData();
    toast.success("Profile data updated");
    navigate('/dashboard');
    };

    return (
        <>
        <Navigation />
        <div className="profile-container">
            <div className="profile-header">
                <h2>Profile</h2>
            </div>
            <div className='form-container'>
                {profileData ? 
                <form className="profile-form" onSubmit={handleSubmit}>
                    <label htmlFor="username">Username:</label>
                    <input type="text" id="username" name="username" value={profileData['username']} onChange={handleChange} />

                    <label htmlFor="subjects">Subjects:</label>
                    <Select
                            defaultValue={selectedSubjects}
                            onChange={setSelectedSubjects}
                            options={subjects}
                            isMulti={true}
                            styles={{
                                menu: provided => ({
                                  ...provided,
                                  backgroundColor: '#333', // Change menu background color
                                }),
                                
                                option: provided => ({
                                  ...provided,
                                  color: '#ccc', // Change option font color
                                }),
                              }}
                        />

                    <label htmlFor="first_name">First Name:</label>
                    <input type="text" id="first_name" name="first_name" value={profileData['first_name']} onChange={handleChange} />

                    <label htmlFor="last_name">Last Name:</label>
                    <input type="text" id="last_name" name="last_name" value={profileData['last_name']} onChange={handleChange} />

                    <label htmlFor="email">Email:</label>
                    <input type="email" id="email" name="email" value={profileData['email']} onChange={handleChange}/>

                    <label htmlFor="profile_picture">Profile Picture:</label>
                    <input type="file" id="profile_picture" name="profile_picture" accept="image/*" onChange={handleFileChange} />

                    <button className="submit-button" type="submit">Submit</button>
                </form>
                :
                <div><p>Loading...</p></div>
                    }
            </div>
        </div>
        </>
    );
}

export default Profile;