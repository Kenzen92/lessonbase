// Login.js
import React from "react";

import MasterScreen from "./masterScreen";
import ClassDashboard from "../components/Dashboard/class_dashboard";
import "../styles/dashboard.css";
import { useParams } from "react-router-dom";

function Dashboard() {
  const { id } = useParams();

  return (
    <MasterScreen>
      <div className="dashboard-container">
        <ClassDashboard classId={id} />
      </div>
    </MasterScreen>
  );
}

export default Dashboard;
