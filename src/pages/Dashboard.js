import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [questionText, setQuestionText] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    setUser(storedUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setQuestionText("");

    const fileInput = document.getElementById("fileUpload");
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleQuestionSubmit = async () => {
    if (!questionText.trim()) {
      alert("Please type a question first!");
      return;
    }

    const textRes = await fetch("http://127.0.0.1:5000/ask-question", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question: questionText.trim() }),
    });

    const textData = await textRes.json();

    if (!textRes.ok) {
      throw new Error(textData.error || "Error while sending question");
    }

    return textData;
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) {
      alert("Please select one or more files first!");
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    const uploadRes = await fetch("http://127.0.0.1:5000/upload-multiple", {
      method: "POST",
      body: formData,
    });

    const uploadData = await uploadRes.json();

    if (!uploadRes.ok) {
      throw new Error(uploadData.error || "Error while uploading");
    }

    const previousFiles =
      JSON.parse(localStorage.getItem("uploadedFilesHistory")) || [];
    const newFileNames = selectedFiles.map((file) => file.name);

    localStorage.setItem(
      "uploadedFilesHistory",
      JSON.stringify([...previousFiles, ...newFileNames])
    );

    return uploadData;
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0 && questionText.trim() === "") {
      alert("Please select a file or type a question first!");
      return;
    }

    try {
      setLoading(true);

      let responseData = {};

      if (questionText.trim()) {
        responseData = await handleQuestionSubmit();
      } else if (selectedFiles.length > 0) {
        responseData = await handleFileUpload();
      }

      let clusters = [];

      if (Array.isArray(responseData)) {
        clusters = responseData;
      } else if (responseData.clusters && Array.isArray(responseData.clusters)) {
        clusters = responseData.clusters;
      } else if (responseData.results && Array.isArray(responseData.results)) {
        clusters = responseData.results;
      } else {
        const resultsRes = await fetch("http://127.0.0.1:5000/results");
        const resultsData = await resultsRes.json();
        clusters = Array.isArray(resultsData) ? resultsData : [];
      }

      navigate("/clustering", {
        state: {
          message: responseData.message || "Processed successfully",
          stats: {
            questionsFound: responseData.questions_found || 0,
            storedInDb: responseData.stored_in_db || 0,
            duplicatesFound: responseData.duplicates_found || 0,
            clustersCreated:
              responseData.clusters_created ||
              (Array.isArray(clusters) ? clusters.length : 0),
            filesUploaded: responseData.files_uploaded || 0,
          },
          clusters,
        },
      });
    } catch (error) {
      console.error("Error:", error);
      alert(error.message || "Error while uploading");
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
          <Link to="/dashboard" className="active-link">
            📂 Dashboard
          </Link>
          <Link to="/clustering">🧠 Clustering</Link>
          <Link to="#">📊 Analytics</Link>
          <Link to="#">🗂 SQL Views</Link>
          <Link to="/about">ℹ️ About</Link>

          <span onClick={handleLogout} style={{ cursor: "pointer" }}>
            🚪 Logout
          </span>
        </div>

        <div className="main">
          <div className="topbar">
            <div>
              <h1 className="page-title">Dashboard</h1>
              <p className="page-subtitle">
                Upload question files or type a question to view clustering
                results.
              </p>
            </div>

            <div className="user-info">
              {user ? `${user.name} | ${user.role}` : "User"}
            </div>
          </div>

          <div className="upload-panel">
            <h3>Upload Question Files</h3>
            <p>
              Select one or more files, or type a question below, then click
              Send.
            </p>

            <div className="chat-input-container">
              <label htmlFor="fileUpload" className="plus-icon">
                <i className="fa-solid fa-plus"></i>
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
                placeholder="Choose files or type your question here..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
              />

              <button
                className="send-btn"
                onClick={handleSubmit}
                disabled={loading}
                type="button"
              >
                {loading ? "..." : "Send"}
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

            {(selectedFiles.length > 0 || questionText.trim()) && (
              <button className="clear-btn" onClick={clearAll} type="button">
                Clear
              </button>
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
                <p>
                  K-Means with Sentence Transformer embeddings for grouping
                  similar questions.
                </p>
              </div>

              <div className="metric-box">
                <h4>Database</h4>
                <p>
                  MySQL stores questions, duplicates, and cluster information
                  efficiently.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;