import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../styles/login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const url = "http://localhost:8000/login";
    const payload = {
      username: username,
      password: password,
    };
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        toast.error("Username or password not correct");
        setUsernameError(true);
        setPasswordError(true);
        return;
      }

      const data = await response.json();
      console.log(data);
      await window.sessionStorage.setItem("token", data["token"]);
      await window.sessionStorage.setItem("user", JSON.stringify(data["user"]));
      console.log(
        "set the user profile url to: ",
        JSON.stringify(data["user"]["profile_picture"])
      );
      navigate("/dashboard");
    } catch (error) {
      toast.error("Connection error. Please try again later.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <h1>Kenny Solutions</h1>
        <h2>A teaching solution for all.</h2>
      </div>
      <div className="login-form-action-container">
        {showForm ? (
          <div className="login-form">
            <form onSubmit={handleLogin} className="login-form">
              <input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameError(false);
                }}
                className={usernameError ? "error" : ""}
              />
              <input
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(false);
                }}
                className={passwordError ? "error" : ""}
              />
              <button type="submit" className="btn-primary">
                Login
              </button>
            </form>
          </div>
        ) : (
          <div className="login-action-container">
            <div className="signin-button">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowForm(true)}
              >
                Sign in
              </button>
            </div>
          </div>
        )}
        <div className="create-account-button">
          <p className="signup-button-section">
            Don't have an account?{" "}
            <Link to="/signup">
              <button className="btn-secondary">Sign up here</button>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
