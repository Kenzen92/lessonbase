import React, { useState } from 'react';
import { Link, useNavigate  } from 'react-router-dom';
import { toast } from "react-toastify";
import '../styles/login.css'

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState('');
    const [usernameError, setUsernameError] = useState(false);
    const [passwordError, setPasswordError] = useState(false);
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
                toast.error("Username or password not correct");
                setUsernameError(true);
                setPasswordError(true);
                return;
            }

            const data = await response.json();
            console.log(data)
            await window.sessionStorage.setItem("Token", data['Token']);
            navigate('/dashboard');
        } catch (error) {
            toast.error("Connection error. Please try again later.")
        }
    };

    return (
            <div className='login-container'>
                <div className="login-header">
                    <h1>Kenny Solutions</h1>
                    <h2>A teaching solution for all.</h2>
                </div>
                {showForm ? 
                    <form onSubmit={handleLogin} className="login-form">
                        <label>
                            Username
                            <input type="text" value={username} onChange={(e) => { setUsername(e.target.value); setUsernameError(false); }} className={usernameError ? 'error' : ''} />
                        </label>
                        <br />
                        <label>
                            Password
                            <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }} className={passwordError ? 'error' : ''} />
                        </label>
                        <br />
                        <button type="submit">Login</button>
                        <p>Don't have an account? <Link to="/signup">Sign up here</Link></p>
                    </form>
                : 
                    <>
                        <button type="button" onClick={() => setShowForm(true)}>Sign in</button>
                        <p>Don't have an account? <Link to="/signup">Sign up here</Link></p>
                    </>
                }

            </div>
    );
}

export default Login;
