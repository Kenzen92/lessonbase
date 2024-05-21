// Login.js
import React, { useState } from 'react';
import { Link, Router, useNavigate } from 'react-router-dom';

import Navigation from '../../components/main_navigation';
import ClassDashboard from '../../components/class_dashboard';
import '../../styles/dashboard.css'


function Dashboard() {


    return (
        <>
            <Navigation />
            <div className="dashboard-container">
                <ClassDashboard />
            </div>
        </>
    );
}

export default Dashboard;
