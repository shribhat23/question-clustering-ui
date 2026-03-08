import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    navigate("/");
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert("Please select at least one file first!");
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      setLoading(true);

      const uploadRes = await fetch("http://127.0.0.1:5000/upload-multiple", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      console.log("Upload response:", uploadData);

      const resultsRes = await fetch("http://127.0.0.1:5000/results");
      const resultsData = await resultsRes.json();
      console.log("Results response:", resultsData);

      navigate("/clustering", {
        state: {
          message: uploadData.message || "",
          stats: {
            questionsFound: uploadData.questions_found || 0,
            storedInDb: uploadData.stored_in_db || 0,
            duplicatesFound: uploadData.duplicates_found || 0,
            clustersCreated: uploadData.clusters_created || 0,
            filesUploaded: uploadData.files_uploaded || 0,
          },
          clusters: Array.isArray(resultsData) ? resultsData : [],
        },
      });
    } catch (error) {
      console.error("Error:", error);
      alert("Error while uploading files");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-body">
        <div className="sidebar">
          <h2>SmartCluster</h2>

          <Link to="/home">🏠 Home</Link>
          <Link to="/dashboard" className="active-link">📂 Dashboard</Link>
          <Link to="/clustering">🧠 Clustering</Link>
          <Link to="#">📊 Analytics</Link>
          <Link to="#">🗂 SQL Views</Link>
          <Link to="#">⚙ Model</Link>

          <span onClick={handleLogout} style={{ cursor: "pointer" }}>
            🚪 Logout
          </span>
        </div>

        <div className="main">
          <div className="topbar">
            <div>
              <h1 className="page-title">Dashboard</h1>
              <p className="page-subtitle">
                Upload question files, process them, and view clustering results.
              </p>
            </div>

            <div className="user-info">Yashaswini E. | MCA Project</div>
          </div>

          <div className="upload-panel">
            <h3>Upload Question Files</h3>
            <p>Select one or more files and click upload to see clustering results.</p>

            <div className="chat-input-container">
              <label htmlFor="fileUpload" className="plus-icon">
                +
              </label>

              <input
                type="file"
                id="fileUpload"
                accept=".csv,.pdf,.doc,.docx,.txt"
                multiple
                onChange={handleFileChange}
                hidden
              />

              <input
                type="text"
                className="chat-input"
                placeholder="Choose files for clustering"
                readOnly
                value={
                  selectedFiles.length > 0
                    ? `${selectedFiles.length} file(s) selected`
                    : ""
                }
              />

              <button
                className="send-btn"
                onClick={handleUpload}
                disabled={loading}
              >
                {loading ? "..." : "Upload"}
              </button>
            </div>

            {selectedFiles.length > 0 && (
              <div className="file-preview">
                <div className="file-preview-title">Selected Files</div>
                <ul className="file-preview-list">
                  {selectedFiles.map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="stats">
            <div className="dashboard-card">
              <h3>2000+</h3>
              <p>Total Questions</p>
            </div>

            <div className="dashboard-card">
              <h3>8</h3>
              <p>Total Subjects</p>
            </div>

            <div className="dashboard-card">
              <h3>5</h3>
              <p>Total Clusters</p>
            </div>

            <div className="dashboard-card">
              <h3>400</h3>
              <p>Avg Questions per Cluster</p>
            </div>

            <div className="dashboard-card">
              <h3>0.82</h3>
              <p>Silhouette Score</p>
            </div>
          </div>

          <div className="section">
            <h2>Key Metrics</h2>

            <div className="metrics">
              <div className="metric-box">
                <h4>Questions Processed</h4>
                <p>2000 records cleaned and vectorized using NLP techniques.</p>
              </div>

              <div className="metric-box">
                <h4>Vocabulary Size</h4>
                <p>Approx 15,000 unique tokens extracted from uploaded questions.</p>
              </div>

              <div className="metric-box">
                <h4>Clustering Algorithm</h4>
                <p>K-Means with Sentence Transformer embeddings for grouping similar questions.</p>
              </div>

              <div className="metric-box">
                <h4>Database</h4>
                <p>MySQL stores questions, duplicates, and cluster information efficiently.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;