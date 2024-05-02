// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './screens/login';
import Signup from './screens/signup';
import Dashboard from './screens/dashboard/dashboard';
import Profile from './screens/profile';
import PrivateRoutes from './components/privateRoute';

function App() {
    return (
        <Router>

                <Routes>
                    <Route element={<PrivateRoutes />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                    </Route>
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/profile" element= {<Profile />} />
                    
                </Routes>

        </Router>
    );
}

export default App;
