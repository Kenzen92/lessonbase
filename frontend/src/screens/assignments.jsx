// Login.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import HomeworkCard from "../components/homework_card";
import Navigation from "../components/main_navigation";
import "../styles/dashboard.css";
import "../styles/assignments.css";

function Assignments() {
  const [homeworks, setHomeworks] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchHomeworks = async () => {
    try {
      const auth = window.sessionStorage.getItem("token");
      const response = await fetch("http://localhost:8000/homework", {
        method: "GET",
        headers: {
          Authorization: `Token ${auth}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        handleUnautherizedRequest(navigate);
      }

      if (!response.ok) {
        throw new Error("Failed to fetch homework tasks");
      }

      const data = await response.json();
      setHomeworks(data); // Assuming the data is an array of homework objects
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchHomeworks();
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <Navigation />
      <div className="homework-dashboard">
        <h2>Your Homework Tasks</h2>
        <div className="homework-cards-section">
          {homeworks.length > 0 ? (
            homeworks.map((homework) => (
              <HomeworkCard key={homework.id} homeworkData={homework} />
            ))
          ) : (
            <p>No homework tasks assigned yet.</p>
          )}
        </div>
      </div>
    </>
  );
}

export default Assignments;
