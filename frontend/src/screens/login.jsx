// Login.js
import React, { useState } from 'react';
import { Link, Router, useNavigate } from 'react-router-dom';


function Login() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        const url = 'http://localhost:8000/login';
        const payload = {
            username: username,
            password: password
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
                setError('Username or password not correct');
                return;
            }

            const data = await response.json();
            console.log(data)
            await window.sessionStorage.setItem("Token", data['Token']);
            navigate('/dashboard');
        } catch (error) {
            console.log('Error: ' + error.message);
        }
    };

    return (
        <div className="App">
            <div>
                <h1>Kenny Solutions</h1>
                <h2>A teaching solution for all.</h2>
            </div>
            {!loggedIn ? (
                <form onSubmit={handleLogin}>
                    <h1>Login</h1>
                    <label>
                        Username:
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </label>
                    <br />
                    <label>
                        Password:
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </label>
                    <br />
                    <button type="submit">Login</button>
                    <p>Don't have an account? <Link to="/signup">Sign up here</Link></p>
                </form>
            ) : (
                <div>
                    <h1>Welcome, {username}!</h1>
                    <button onClick={() => setLoggedIn(false)}>Logout</button>
                </div>
            )}
            {error ? (
                <p>{error}</p>
              )  : 
                (
                    <p></p>
                )
                
            }
        </div>
    );
}

export default Login;
