import React, { useState } from 'react';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    // Add your authentication logic here
    // For simplicity, let's just compare hardcoded username and password
    if (username === 'admin' && password === 'password') {
      setLoggedIn(true);
      alert('Login successful!');
    } else {
      alert('Invalid username or password');
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

export default App;
