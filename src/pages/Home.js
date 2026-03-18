import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Home.css";

function Home() {
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showUploads, setShowUploads] = useState(false);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    setUser(storedUser);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const uploadedFiles =
    JSON.parse(localStorage.getItem("uploadedFilesHistory")) || [];

  return (
    <div className="home-page">
      <div className="home-body">
        <div className="sidebar">
          <h2>SmartCluster</h2>

          <Link to="/home" className="active-link">
            🏠 Home
          </Link>
          <Link to="/dashboard">📂 Dashboard</Link>
          <Link to="/clustering">🧠 Clustering</Link>
          <Link to="#">📊 Analytics</Link>
          <Link to="#">🗂 Model</Link>
          <Link to="/about">ℹ️ About</Link>

          <span onClick={handleLogout} style={{ cursor: "pointer" }}>
            🚪 Logout
          </span>
        </div>

        <div className="main">
          <div className="topbar">
            <div className="topbar-left">
              <h1 className="page-title">Home</h1>
              <p className="page-subtitle">
                Welcome to Smart Question Clustering System
              </p>
            </div>

            <div className="topbar-right" ref={menuRef}>
              {user ? (
                <>
                  <div className="profile-section">
                    <div className="profile-image-wrap">
                      <img
                        src={user.profilePic || "https://i.pravatar.cc/80"}
                        alt="profile"
                        className="profile-pic"
                      />
                      <span className="online-dot"></span>
                    </div>

                    <div className="profile-info">
                      <span className="username">{user.name || "User"}</span>
                      <span className="user-role">
                        {user.role || "Student"}
                      </span>
                    </div>
                  </div>

                  <div
                    className="menu-icon"
                    onClick={() => setShowMenu(!showMenu)}
                  >
                    ⋮
                  </div>

                  {showMenu && (
                    <div className="dropdown-menu">
                      <span
                        onClick={() => {
                          setShowProfile(true);
                          setShowUploads(false);
                          setShowMenu(false);
                        }}
                      >
                        View Profile
                      </span>

                      <span
                        onClick={() => {
                          setShowUploads(true);
                          setShowProfile(false);
                          setShowMenu(false);
                        }}
                      >
                        My Uploads
                      </span>

                      <span
                        onClick={() => {
                          alert("Settings will be added in future.");
                          setShowMenu(false);
                        }}
                      >
                        Settings
                      </span>

                      <span onClick={handleLogout}>Logout</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="user-info">User</div>
              )}
            </div>
          </div>

          {showProfile && user && (
            <div className="popup-card">
              <h2>User Profile</h2>

              <div className="profile-popup-content">
                <img
                  src={user.profilePic || "https://i.pravatar.cc/100"}
                  alt="profile"
                  className="profile-large"
                />
                <p>
                  <strong>Name:</strong> {user.name}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>Role:</strong> {user.role}
                </p>
              </div>

              <button
                className="primary-btn close-btn"
                onClick={() => setShowProfile(false)}
              >
                Close
              </button>
            </div>
          )}

          {showUploads && (
            <div className="popup-card">
              <h2>My Uploads</h2>

              {uploadedFiles.length > 0 ? (
                <ul className="uploads-list">
                  {uploadedFiles.map((file, index) => (
                    <li key={index}>{file}</li>
                  ))}
                </ul>
              ) : (
                <p>No uploaded files found.</p>
              )}

              <button
                className="primary-btn close-btn"
                onClick={() => setShowUploads(false)}
              >
                Close
              </button>
            </div>
          )}

          {!showProfile && !showUploads && (
            <>
              <div className="hero-section">
                <div className="hero-left">
                  <h1>Welcome to SmartCluster</h1>
                  <p>
                    An intelligent MCA project that clusters academic questions
                    using NLP, embeddings, and K-Means algorithm for better
                    organization and analysis.
                  </p>

                  <div className="hero-buttons">
                    <button
                      className="primary-btn"
                      onClick={() => navigate("/dashboard")}
                    >
                      Go to Dashboard
                    </button>

                    <button
                      className="secondary-btn"
                      onClick={() => navigate("/about")}
                    >
                      About
                    </button>
                  </div>
                </div>

                <div className="hero-right">
                  <div className="hero-illustration">🧠📊</div>
                </div>
              </div>

              <div className="section">
                <h2>Quick Actions</h2>
                <div className="quick-actions">
                  <button onClick={() => navigate("/dashboard")}>
                    Upload Questions
                  </button>
                  <button onClick={() => navigate("/clustering")}>
                    View Clusters
                  </button>
                  <button onClick={() => navigate("/dashboard")}>
                    Open Dashboard
                  </button>
                </div>
              </div>

              <div className="stats">
                <div className="stat-card">
                  <h3>2000+</h3>
                  <p>Total Questions</p>
                </div>

                <div className="stat-card">
                  <h3>8</h3>
                  <p>Total Subjects</p>
                </div>

                <div className="stat-card">
                  <h3>5</h3>
                  <p>Total Clusters</p>
                </div>

                <div className="stat-card">
                  <h3>0.82</h3>
                  <p>Silhouette Score</p>
                </div>
              </div>

              <div className="features">
                <div className="feature-card">
                  <h3>📂 Dataset Management</h3>
                  <p>Manage 2000+ academic questions stored in database.</p>
                </div>

                <div className="feature-card">
                  <h3>🧠 Intelligent Clustering</h3>
                  <p>Group similar questions using NLP embeddings.</p>
                </div>

                <div className="feature-card">
                  <h3>📊 Data Analytics</h3>
                  <p>Visualize clustering results and performance.</p>
                </div>
              </div>

              <div className="section">
                <h2>Project Highlights</h2>
                <div className="highlights">
                  <div className="highlight-box">
                    <h4>AI-Based Clustering</h4>
                    <p>
                      Uses NLP and machine learning to group similar academic
                      questions automatically.
                    </p>
                  </div>

                  <div className="highlight-box">
                    <h4>Multi-File Upload</h4>
                    <p>
                      Teachers and students can upload multiple files for fast
                      processing and clustering.
                    </p>
                  </div>

                  <div className="highlight-box">
                    <h4>Duplicate Detection</h4>
                    <p>
                      Detects repeated questions and helps maintain a cleaner
                      question database.
                    </p>
                  </div>

                  <div className="highlight-box">
                    <h4>MySQL Database Support</h4>
                    <p>
                      Stores questions, clusters, duplicates, and metadata in a
                      structured database.
                    </p>
                  </div>
                </div>
              </div>

              <div className="section">
                <h2>Process Flow</h2>
                <div className="process-flow">
                  <div className="process-step">1️⃣ Upload Questions</div>
                  <div className="process-arrow">→</div>
                  <div className="process-step">2️⃣ NLP Processing</div>
                  <div className="process-arrow">→</div>
                  <div className="process-step">3️⃣ Embedding Generation</div>
                  <div className="process-arrow">→</div>
                  <div className="process-step">4️⃣ K-Means Clustering</div>
                  <div className="process-arrow">→</div>
                  <div className="process-step">5️⃣ Cluster Output</div>
                </div>
              </div>

              <footer className="footer">
                <p>© 2026 SmartCluster | MCA Final Year Project</p>
                <p>NLP + Machine Learning + React + Flask + MySQL</p>
              </footer>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;