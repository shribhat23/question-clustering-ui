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
          <Link to="/clustering">🧠 Question Clustering</Link>
          <Link to="/analytics">📊 Learning Analytics</Link>
          <Link to="/model">⚙️ Model</Link>

          <Link to="/about" className="active-link">
            ℹ️ About
          </Link>

          <span onClick={handleLogout}>🚪 Logout</span>
        </div>

        {/* Main Content */}
        <div className="about-main">
          <div className="about-hero">
            <h1>About SmartCluster</h1>
            <p>
              SmartCluster is an intelligent academic question analysis system
              developed as an MCA project. It processes uploaded question files,
              removes duplicates, detects subject categories, and groups similar
              questions using Natural Language Processing, semantic similarity,
              and machine learning techniques.
            </p>
          </div>

          <div className="about-grid">
            <div className="about-card">
              <h2>Project Overview</h2>
              <p>
                The main purpose of SmartCluster is to organize academic
                questions in a smarter way. Instead of manually sorting large
                question sets, the system automatically extracts questions,
                identifies patterns, predicts topics, and creates meaningful
                topic-based groups.
              </p>
            </div>

            <div className="about-card">
              <h2>Key Features</h2>
              <ul>
                <li>Multi-file upload support</li>
                <li>Automatic duplicate removal</li>
                <li>Semantic similarity detection</li>
                <li>Topic prediction and classification</li>
                <li>Question grouping by subject</li>
                <li>Learning analytics dashboard</li>
              </ul>
            </div>

            <div className="about-card">
              <h2>Technologies Used</h2>
              <ul>
                <li>React.js for frontend</li>
                <li>Flask for backend</li>
                <li>SentenceTransformer for embeddings</li>
                <li>Cosine Similarity for matching</li>
                <li>Logistic Regression for classification</li>
                <li>SQLite / MySQL for storage</li>
              </ul>
            </div>

            <div className="about-card">
              <h2>Project Objective</h2>
              <p>
                This project aims to reduce manual effort in handling academic
                questions and to help students and teachers analyze important
                subjects more effectively through intelligent clustering and
                classification.
              </p>
            </div>

            <div className="about-card">
              <h2>Real-World Use</h2>
              <ul>
                <li>Helps students prepare for exams topic-wise</li>
                <li>Helps teachers analyze repeated question patterns</li>
                <li>Creates a structured question bank</li>
                <li>Improves learning insights through analytics</li>
              </ul>
            </div>

            <div className="about-card highlight-card">
              <h2>Smart Summary</h2>
              <p>
                SmartCluster is a hybrid NLP + ML system for intelligent
                academic question clustering, subject detection, and learning
                analysis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;