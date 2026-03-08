import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../Home.css";

function Home() {
  const navigate = useNavigate();
  const [showAbout, setShowAbout] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    setUser(storedUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  return (
    <div className="home-page">
      <div className="navbar">
        <div className="logo">SmartCluster</div>

        <div className="nav-links">
          <span onClick={() => setShowAbout(false)}>Home</span>
          <span onClick={() => setShowAbout(true)}>About</span>
          <Link to="/dashboard" style={{ color: "white", textDecoration: "none", marginLeft: "15px" }}>
            Dashboard
          </Link>
        </div>

        <div className="right-section">
          {user ? (
            <div className="profile-section">
              <img
                src={user.profilePic || "https://i.pravatar.cc/40"}
                alt="profile"
                className="profile-pic"
              />

              <div className="user-info">
                <span className="username">{user.name}</span>
                <span className="user-role">{user.role}</span>
              </div>
            </div>
          ) : (
            <div className="nav-buttons">
              <Link to="/">
                <button className="login-btn">Login</button>
              </Link>
              <Link to="/signup">
                <button className="signup-btn">Sign Up</button>
              </Link>
            </div>
          )}

          <div className="menu-container">
            <div className="dots" onClick={() => setShowMenu(!showMenu)}>
              ⋮
            </div>

            {showMenu && (
              <div className="dropdown">
                <a href="#">View Profile</a>
                <a href="#">Manage Devices</a>
                <a href="#">Developer Console</a>
                {user && (
                  <span
                    onClick={handleLogout}
                    style={{ display: "block", padding: "12px", cursor: "pointer" }}
                  >
                    Logout
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {!showAbout && (
        <div>
          <div className="hero">
            <h1>Welcome to Smart Question Clustering System</h1>
            <p>
              An intelligent MCA project that clusters questions
              using NLP and K-Means algorithm.
            </p>

            <div className="hero-buttons">
              <button
                className="start-btn"
                onClick={() => navigate("/dashboard")}
              >
                Go to Dashboard
              </button>

              <button
                className="learn-btn"
                onClick={() => setShowAbout(true)}
              >
                Learn More
              </button>
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
        </div>
      )}

      {showAbout && (
        <div className="about-section">
          <h2>About SmartCluster</h2>
          <p>
            SmartCluster is an intelligent Question Clustering System developed as an MCA
            project that automatically groups 12th standard academic questions based on
            semantic similarity using Natural Language Processing (NLP) and Machine Learning techniques.
          </p>
        </div>
      )}

      <div className="footer">© 2026 SmartCluster | MCA Project</div>
    </div>
  );
}

export default Home;