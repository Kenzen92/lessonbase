import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { IconContext } from 'react-icons';
import { FaFolder } from 'react-icons/fa';
import Login from './screens/login';
import Signup from './screens/signup';
import Dashboard from './screens/dashboard/dashboard';
import Profile from './screens/profile';
import PrivateRoutes from './components/privateRoute';
import ToastNotification from './components/notification';
import Students from './screens/students';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';


function App() {
    const auth = window.sessionStorage.getItem("Token");
    
    return (
        <IconContext.Provider value={{ color: "blue", className: "global-class-name" }}>
            <>
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/" element={auth ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
                        <Route element={<PrivateRoutes />}>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/students" element={<Students />} />
                        </Route>
                    </Routes>
                </Router>
                <ToastNotification />
            </>
        </IconContext.Provider>
    );
}

export default App; 
