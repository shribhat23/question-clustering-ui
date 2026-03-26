import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Home.css";

const API_BASE = "http://127.0.0.1:5000";

function Home() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    total_uploaded_files: 0,
    total_questions: 0,
    labeled_questions: 0,
    total_categories: 0,
    classifier_trained: false,
  });
  const [topicDistribution, setTopicDistribution] = useState([]);
  const [modelStatus, setModelStatus] = useState({
    classifier_trained: false,
    topic_counts: [],
    uses_sentence_transformer: true,
    uses_logistic_regression: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    setUser(storedUser);
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);

      const [statsRes, topicRes, modelRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard-stats`),
        fetch(`${API_BASE}/topic-distribution`),
        fetch(`${API_BASE}/model-status`),
      ]);

      const statsData = await statsRes.json();
      const topicData = await topicRes.json();
      const modelData = await modelRes.json();

      if (statsRes.ok) {
        setStats({
          total_uploaded_files: statsData.total_uploaded_files || 0,
          total_questions: statsData.total_questions || 0,
          labeled_questions: statsData.labeled_questions || 0,
          total_categories: statsData.total_categories || 0,
          classifier_trained: !!statsData.classifier_trained,
        });
      }

      if (topicRes.ok && Array.isArray(topicData)) {
        setTopicDistribution(topicData);
      } else {
        setTopicDistribution([]);
      }

      if (modelRes.ok) {
        setModelStatus({
          classifier_trained: !!modelData.classifier_trained,
          topic_counts: Array.isArray(modelData.topic_counts)
            ? modelData.topic_counts
            : [],
          uses_sentence_transformer: !!modelData.uses_sentence_transformer,
          uses_logistic_regression: !!modelData.uses_logistic_regression,
        });
      }
    } catch (error) {
      console.error("Home load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const homeInsights = useMemo(() => {
    const totalQuestions = stats.total_questions || 0;
    const labeledQuestions = stats.labeled_questions || 0;
    const labelCoverage =
      totalQuestions > 0
        ? Math.round((labeledQuestions / totalQuestions) * 100)
        : 0;

    const sortedTopics = [...topicDistribution].sort(
      (a, b) => (b.count || 0) - (a.count || 0)
    );

    const topTopic = sortedTopics[0] || null;

    return {
      labelCoverage,
      topTopic,
    };
  }, [stats, topicDistribution]);

  return (
    <div className="home-page">
      <div className="home-body">
        <div className="sidebar">
          <h2>SmartCluster</h2>

          <Link to="/home" className="active-link">
            🏠 Home
          </Link>
          <Link to="/dashboard">📂 Dashboard</Link>
          <Link to="/clustering">🧠 Question Clustering</Link>
          <Link to="/analytics">📊 Learning Analytics</Link>
          <Link to="/model-module">⚙️ Model</Link>
          <Link to="/about">ℹ️ About</Link>

          <span onClick={handleLogout} style={{ cursor: "pointer" }}>
            🚪 Logout
          </span>
        </div>

        <div className="main">
          <div className="topbar">
            <div>
              <h1 className="page-title">Home</h1>
              <p className="page-subtitle">
                Smart academic question clustering and subject intelligence system
              </p>
            </div>

            <div className="user-info">
              {user ? `${user.name || "User"} | ${user.role || "Student"}` : "User"}
            </div>
          </div>

          <div className="hero-section">
            <div className="hero-left">
              <span className="hero-badge">AI + NLP Project Workspace</span>
              <h2>Welcome to SmartCluster, {user?.name || "User"} 👋</h2>
              <p>
                Organize academic question banks, detect subjects automatically,
                remove duplicate questions, improve labeling quality, and generate
                better clusters using semantic intelligence and machine learning.
              </p>

              <div className="hero-buttons">
                <button
                  className="primary-btn"
                  onClick={() => navigate("/dashboard")}
                  type="button"
                >
                  Open Dashboard
                </button>

                <button
                  className="secondary-btn"
                  onClick={() => navigate("/clustering")}
                  type="button"
                >
                  View Clusters
                </button>
              </div>
            </div>

            <div className="hero-right">
              <div className="hero-icon">🧠</div>
              <div className="hero-mini-card">
                <h4>System Status</h4>
                <p>{stats.classifier_trained ? "Model Ready" : "Training Needed"}</p>
              </div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <h3>{loading ? "..." : stats.total_questions}</h3>
              <p>Total Questions</p>
            </div>

            <div className="stat-card">
              <h3>{loading ? "..." : stats.total_uploaded_files}</h3>
              <p>Uploaded Files</p>
            </div>

            <div className="stat-card">
              <h3>{loading ? "..." : stats.total_categories}</h3>
              <p>Total Categories</p>
            </div>

            <div className="stat-card">
              <h3>{loading ? "..." : `${homeInsights.labelCoverage}%`}</h3>
              <p>Label Coverage</p>
            </div>
          </div>

          <div className="section">
            <h2>What SmartCluster Does</h2>
            <div className="feature-grid">
              <div className="feature-card">
                <h3>📂 Multi-file Academic Input</h3>
                <p>
                  Collect question banks from uploaded files and organize them into
                  a clean structured dataset for analysis.
                </p>
              </div>

              <div className="feature-card">
                <h3>🏷 Subject Detection</h3>
                <p>
                  Automatically map questions into academic categories such as Python,
                  DBMS, Operating System, Web Development, and more.
                </p>
              </div>

              <div className="feature-card">
                <h3>🧹 Duplicate Cleanup</h3>
                <p>
                  Remove repeated or similar question entries so the database becomes
                  cleaner and more useful for clustering.
                </p>
              </div>

              <div className="feature-card">
                <h3>🧠 Semantic Clustering</h3>
                <p>
                  Use embeddings and machine learning support to group similar academic
                  questions in meaningful clusters.
                </p>
              </div>

              <div className="feature-card">
                <h3>📊 Dataset Intelligence</h3>
                <p>
                  Track subject distribution, label coverage, model status, and data
                  quality from one connected system.
                </p>
              </div>

              <div className="feature-card">
                <h3>⚙️ Project-ready Workflow</h3>
                <p>
                  Designed as a final-year MCA project with Flask backend, React frontend,
                  database storage, and NLP-based processing.
                </p>
              </div>
            </div>
          </div>

          <div className="double-grid">
            <div className="section compact-section">
              <h2>Project Highlights</h2>
              <div className="highlight-list">
                <div className="highlight-item">
                  <span>01</span>
                  <div>
                    <h4>Question Bank Organization</h4>
                    <p>Centralize academic questions subject-wise in one place.</p>
                  </div>
                </div>

                <div className="highlight-item">
                  <span>02</span>
                  <div>
                    <h4>Subject-aware Intelligence</h4>
                    <p>Improve accuracy using category-aware processing and labeling.</p>
                  </div>
                </div>

                <div className="highlight-item">
                  <span>03</span>
                  <div>
                    <h4>Ready for Expansion</h4>
                    <p>Can be extended later with charts, recommendations, and search.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="section compact-section">
              <h2>Current Project Snapshot</h2>
              <div className="snapshot-card">
                <div className="snapshot-row">
                  <span>Top Topic</span>
                  <strong>
                    {homeInsights.topTopic
                      ? `${homeInsights.topTopic.category} (${homeInsights.topTopic.count})`
                      : "No data"}
                  </strong>
                </div>

                <div className="snapshot-row">
                  <span>Classifier</span>
                  <strong>
                    {modelStatus.classifier_trained ? "Trained" : "Not Trained"}
                  </strong>
                </div>

                <div className="snapshot-row">
                  <span>Sentence Transformer</span>
                  <strong>
                    {modelStatus.uses_sentence_transformer ? "Enabled" : "Disabled"}
                  </strong>
                </div>

                <div className="snapshot-row">
                  <span>Logistic Regression</span>
                  <strong>
                    {modelStatus.uses_logistic_regression ? "Enabled" : "Disabled"}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className="section">
            <h2>Workflow</h2>
            <div className="workflow-grid">
              <div className="workflow-card">
                <span>1</span>
                <h4>Upload Questions</h4>
                <p>Add academic question files into the backend system.</p>
              </div>

              <div className="workflow-card">
                <span>2</span>
                <h4>Process & Clean</h4>
                <p>Extract question text and remove repeated entries.</p>
              </div>

              <div className="workflow-card">
                <span>3</span>
                <h4>Detect Subject</h4>
                <p>Assign questions into meaningful academic categories.</p>
              </div>

              <div className="workflow-card">
                <span>4</span>
                <h4>Generate Clusters</h4>
                <p>Group similar questions using clustering and semantic similarity.</p>
              </div>
            </div>
          </div>

          <div className="footer-note">
            <p>
              SmartCluster is built to make academic question management cleaner,
              smarter, and more useful for clustering and classification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;