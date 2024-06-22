// Login.js
import React, { useState } from 'react';
import { Link, Router, useNavigate } from 'react-router-dom';

import MasterScreen from '../masterScreen';
import ClassDashboard from '../../components/class_dashboard';
import '../../styles/dashboard.css'


function Dashboard() {


    return (
        <MasterScreen>
            <div className="dashboard-container">
                <ClassDashboard />
            </div>
        </MasterScreen>
    );
}

export default Dashboard;
