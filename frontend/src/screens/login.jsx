// Login.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Login() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        // Implement login functionality here
        setLoggedIn(true);
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
        </div>
    );
}

export default Login;
