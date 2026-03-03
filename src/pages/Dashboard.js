import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../Dashboard.css";

function Dashboard() {

  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);

  const handleLogout = () => {
    navigate("/");
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      alert("Please select a file first!");
      return;
    }

    localStorage.setItem("uploadedFile", selectedFile.name);
    navigate("/clustering");
  };

  return (
    <div className="dashboard-body">

      {/* SIDEBAR */}
      <div className="sidebar">
        <h2>SmartCluster</h2>

        <Link to="/home">🏠 Home</Link>
        <Link to="#">📂 Dashboard</Link>
        <Link to="/clustering">🧠 Clustering</Link>
        <Link to="#">📊 Analytics</Link>
        <Link to="#">🗂 SQL Views</Link>
        <Link to="#">⚙ Model</Link>

        <span onClick={handleLogout} style={{ cursor: "pointer" }}>
          🚪 Logout
        </span>
      </div>

      {/* MAIN */}
      <div className="main">

        <div className="topbar">

  <div className="chat-input-container">

    {/* PLUS ICON */}
    <label htmlFor="fileUpload" className="plus-icon">
      +
    </label>

    <input
      type="file"
      id="fileUpload"
      accept=".csv,.pdf,.doc,.docx,.txt"
      onChange={handleFileChange}
      hidden
    />

    {/* TEXT INPUT */}
    <input
      type="text"
      className="chat-input"
      placeholder="Got a question in your mind ask now!!"
    />

    {/* SEND BUTTON */}
    <button className="send-btn" onClick={handleUpload}>
      ➤
    </button>

  </div>

  <div className="user-info">
    Yashaswini E. | MCA Project
  </div>

</div>

        {/* Selected File */}
        {selectedFile && (
          <div className="file-preview">
            📎 Selected: {selectedFile.name}
          </div>
        )}

        {/* STATS */}
        <div className="stats">
          <div className="card">
            <h3>2000+</h3>
            <p>Total Questions</p>
          </div>

          <div className="card">
            <h3>8</h3>
            <p>Total Subjects</p>
          </div>

          <div className="card">
            <h3>5</h3>
            <p>Total Clusters</p>
          </div>

          <div className="card">
            <h3>400</h3>
            <p>Avg Questions per Cluster</p>
          </div>

          <div className="card">
            <h3>0.82</h3>
            <p>Silhouette Score</p>
          </div>
        </div>

        {/* METRICS */}
        <div className="section">
          <h2>Key Metrics</h2>

          <div className="metrics">
            <div className="metric-box">
              <h4>Questions Processed</h4>
              <p>2000 records cleaned and vectorized using NLP.</p>
            </div>

            <div className="metric-box">
              <h4>Vocabulary Size</h4>
              <p>Approx 15,000 unique tokens extracted.</p>
            </div>

            <div className="metric-box">
              <h4>Clustering Algorithm</h4>
              <p>K-Means with Sentence Transformers embeddings.</p>
            </div>

            <div className="metric-box">
              <h4>Database</h4>
              <p>MySQL with indexed question_id and cluster_id.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;