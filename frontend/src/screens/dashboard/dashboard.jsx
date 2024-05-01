// Login.js
import React, { useState } from 'react';
import { Link, Router, useNavigate } from 'react-router-dom';

import Navigation from '../../components/main_navigation';
import ClassDashboard from '../../components/class_dashboard';
import '../../styles/dashboard.css'


function Dashboard() {


    return (
        <div className="App">
            <div>
                <h1 className="dashboard-header">Kenny Solutions</h1>
                <Navigation />
                <ClassDashboard />
            </div>
        </div>
    );
}

export default Dashboard;
