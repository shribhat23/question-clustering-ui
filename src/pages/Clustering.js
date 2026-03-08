import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../Clustering.css";

function Clustering() {
  const location = useLocation();
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    questionsFound: 0,
    storedInDb: 0,
    duplicatesFound: 0,
    clustersCreated: 0,
    filesUploaded: 0,
  });

  useEffect(() => {
    if (location.state) {
      setMessage(location.state.message || "");
      setClusters(location.state.clusters || []);
      setStats(
        location.state.stats || {
          questionsFound: 0,
          storedInDb: 0,
          duplicatesFound: 0,
          clustersCreated: 0,
          filesUploaded: 0,
        }
      );
    }
  }, [location.state]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (files.length === 0) {
      alert("Please select one or more files");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      setLoading(true);
      setMessage("");
      setClusters([]);

      const uploadRes = await fetch("http://127.0.0.1:5000/upload-multiple", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      console.log("Upload response:", uploadData);

      setMessage(uploadData.message || "");

      setStats({
        questionsFound: uploadData.questions_found || 0,
        storedInDb: uploadData.stored_in_db || 0,
        duplicatesFound: uploadData.duplicates_found || 0,
        clustersCreated: uploadData.clusters_created || 0,
        filesUploaded: uploadData.files_uploaded || 0,
      });

      const resultsRes = await fetch("http://127.0.0.1:5000/results");
      const resultsData = await resultsRes.json();
      console.log("Results response:", resultsData);

      if (Array.isArray(resultsData)) {
        setClusters(resultsData);
      } else {
        setClusters([]);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Error while uploading or fetching results");
      setClusters([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="clustering-page">
      <div className="clustering-body">
        <div className="sidebar">
          <h2>SmartCluster</h2>

          <Link to="/home">🏠 Home</Link>
          <Link to="/dashboard">📂 Dashboard</Link>
          <Link to="/clustering" className="active-link">
            🧠 Clustering
          </Link>
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
              <h1 className="page-title">Clustering Results</h1>
              <p className="page-subtitle">
                Upload files and view grouped question clusters with statistics.
              </p>
            </div>

            <div className="user-info">Yashaswini E. | MCA Project</div>
          </div>

          <div className="upload-panel">
            <h3>Upload Files for Clustering</h3>
            <p>
              Select one or more files and click upload to process and view the
              clustering results.
            </p>

            <form onSubmit={handleUpload}>
              <div className="chat-input-container">
                <label htmlFor="clusterFileUpload" className="plus-icon">
                  +
                </label>

                <input
                  type="file"
                  id="clusterFileUpload"
                  accept=".csv,.pdf,.doc,.docx,.txt"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files))}
                  hidden
                />

                <input
                  type="text"
                  className="chat-input"
                  placeholder="Choose files for clustering"
                  readOnly
                  value={files.length > 0 ? `${files.length} file(s) selected` : ""}
                />

                <button type="submit" className="send-btn" disabled={loading}>
                  {loading ? "..." : "Upload"}
                </button>
              </div>
            </form>

            {files.length > 0 && (
              <div className="file-preview">
                <div className="file-preview-title">Selected Files</div>
                <ul className="file-preview-list">
                  {files.map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}

            {message && (
              <div
                className={`message-box ${
                  message.toLowerCase().includes("error")
                    ? "message-error"
                    : "message-success"
                }`}
              >
                {message}
              </div>
            )}
          </div>

          {(stats.questionsFound > 0 || stats.clustersCreated > 0) && (
            <div className="stats">
              <div className="cluster-stat-card">
                <h3>{stats.filesUploaded}</h3>
                <p>Files Uploaded</p>
              </div>

              <div className="cluster-stat-card">
                <h3>{stats.questionsFound}</h3>
                <p>Questions Found</p>
              </div>

              <div className="cluster-stat-card">
                <h3>{stats.storedInDb}</h3>
                <p>Stored in DB</p>
              </div>

              <div className="cluster-stat-card">
                <h3>{stats.duplicatesFound}</h3>
                <p>Duplicates Found</p>
              </div>

              <div className="cluster-stat-card">
                <h3>{stats.clustersCreated}</h3>
                <p>Clusters Created</p>
              </div>
            </div>
          )}

          <div className="section">
            <h2>Cluster Results</h2>

            {loading ? (
              <div className="empty-state">Processing files, please wait...</div>
            ) : clusters.length > 0 ? (
              <div className="cluster-grid">
                {clusters.map((item, index) => (
                  <div key={index} className="cluster-card">
                    <div className="cluster-header">
                      <span className="cluster-badge">
                        {item.cluster || `Cluster ${index + 1}`}
                      </span>
                      <h3>{item.topic || "Untitled Topic"}</h3>
                    </div>

                    <div className="question-count">
                      Total Questions:{" "}
                      {Array.isArray(item.questions) ? item.questions.length : 0}
                    </div>

                    <ul className="question-list">
                      {Array.isArray(item.questions) &&
                        item.questions.map((q, i) => (
                          <li key={i} className="question-item">
                            {q}
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                No clusters to display. Upload files to see results.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Clustering;