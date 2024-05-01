import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Signup() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchSubjects = async () => {
        try {
            const auth = window.sessionStorage.getItem("Token");
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
            setSubjects(data);
        } catch (error) {
            setError(error.message);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    const handleRegister = async (e) => {
        e.preventDefault();
        const url = 'http://localhost:8000/register_user';
        const payload = {
            username: username,
            email: email,
            password: password,
            user_type: 1,
            subjects: selectedSubjects
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                setError('Failed to create account.');
                return;
            }

            const data = await response.json();
            console.log(data);
            navigate('/login');
        } catch (error) {
            setError('Error: ' + error.message);
        }
    };
    

        

    return (
        <div>
            <h1>Sign Up</h1>
            <form onSubmit={handleRegister}>
                <label>
                    Username:
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                </label>
                <br />
                <label>
                    Email:
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
                <br />
                <label>
                    Password:
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </label>
                <br />
                <label>
                    Subjects:
                    <select
                            id="subjects"
                            multiple
                            value={selectedSubjects}
                            onChange={(e) => setSelectedSubjects(Array.from(e.target.selectedOptions, (option) => option.value))}
                            required
                            className="form-input"
                            >
                            {subjects.map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.name}
                                </option>
                            ))}
                        </select>
                </label>
                <button type="submit">Sign Up</button>
            </form>
        </div>
    );
}

export default Signup;
