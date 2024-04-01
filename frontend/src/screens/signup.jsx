import React, { useState } from 'react';

function Signup() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    const handleRegister = async (e) => {
        e.preventDefault();
        const url = 'http://localhost:8000/register_teacher';
        const payload = {
            username: username,
            email: email,
            password: password
        };
        console.log(payload);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                setError('Failed to get token.');
                return;
            }

            const data = await response.json();
            console.log(data);
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
                <button type="submit">Sign Up</button>
            </form>
        </div>
    );
}

export default Signup;
