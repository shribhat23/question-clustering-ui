import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/About.css";

function About() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  return (
    <div className="about-page">
      <div className="about-body">
        
        {/* Sidebar */}
        <div className="sidebar">
          <h2>SmartCluster</h2>

          <Link to="/home">🏠 Home</Link>
          <Link to="/dashboard">📂 Dashboard</Link>
          <Link to="/clustering">🧠 Clustering</Link>
          <Link to="#">📊 Analytics</Link>
          <Link to="#">🗂 SQL Views</Link>

          <Link to="/about" className="active-link">
            ℹ️ About
          </Link>

          <span onClick={handleLogout}>🚪 Logout</span>
        </div>

        {/* Main Content */}
        <div className="about-main">

          <div className="about-card">
            <h2>About SmartCluster</h2>

            <p>
              SmartCluster is an intelligent question clustering system built as
              an MCA project. It uses Natural Language Processing, embeddings,
              and K-Means clustering to group similar academic questions
              automatically.
            </p>

            <p>
              The system helps teachers and students organize large question
              sets, identify duplicates, upload multiple files, and analyze
              academic data more efficiently.
            </p>

          </div>

        </div>
      </div>
    </div>
  );
}

export default About;