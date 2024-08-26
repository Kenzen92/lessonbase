import React from "react";
import "../styles/HomeworkCard.css"; // You can style it similarly to ClassEventCard

const HomeworkCard = ({ homeworkData }) => {
  const dueDate = new Date(homeworkData.due_date).toLocaleString();

  return (
    <div className="homework-card">
      <h3>{homeworkData.title}</h3>
      <p>{homeworkData.description}</p>
      <p>Due Date: {dueDate}</p>
      <p>Max Score: {homeworkData.max_score}</p>
      <p>Mandatory: {homeworkData.is_mandatory ? "Yes" : "No"}</p>
    </div>
  );
};

export default HomeworkCard;
