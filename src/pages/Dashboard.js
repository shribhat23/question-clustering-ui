import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

const API_BASE = "http://127.0.0.1:5000";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    total_uploaded_files: 0,
    total_questions: 0,
    labeled_questions: 0,
    total_categories: 0,
    classifier_trained: false,
  });

  const [modelStatus, setModelStatus] = useState({
    classifier_trained: false,
    topic_counts: [],
    uses_sentence_transformer: true,
    uses_logistic_regression: false,
  });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    setUser(storedUser);
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [statsRes, modelRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard-stats`),
        fetch(`${API_BASE}/model-status`),
      ]);

      const statsData = await statsRes.json();
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
      console.error("Dashboard load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const dashboardInsights = useMemo(() => {
    const totalQuestions = stats.total_questions || 0;
    const labeledQuestions = stats.labeled_questions || 0;
    const unlabeledQuestions = Math.max(totalQuestions - labeledQuestions, 0);

    const labelCoverage =
      totalQuestions > 0
        ? Math.round((labeledQuestions / totalQuestions) * 100)
        : 0;

    const sortedTopics = [...modelStatus.topic_counts].sort(
      (a, b) => (b.count || 0) - (a.count || 0)
    );

    const topTopic = sortedTopics[0] || null;

    let learningStage = "Starter";
    if (labelCoverage >= 85 && totalQuestions >= 100) {
      learningStage = "Advanced";
    } else if (labelCoverage >= 60 && totalQuestions >= 50) {
      learningStage = "Improving";
    } else if (totalQuestions > 0) {
      learningStage = "Developing";
    }

    let revisionPriority = "Low";
    if (unlabeledQuestions > 40 || labelCoverage < 50) {
      revisionPriority = "High";
    } else if (unlabeledQuestions > 15 || labelCoverage < 75) {
      revisionPriority = "Medium";
    }

    return {
      unlabeledQuestions,
      labelCoverage,
      topTopic,
      learningStage,
      revisionPriority,
    };
  }, [stats, modelStatus]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-body">
        <div className="sidebar">
          <h2>SmartCluster</h2>

          <Link to="/home">🏠 Home</Link>
          <Link to="/dashboard" className="active-link">
            📂 Dashboard
          </Link>
          <Link to="/clustering">🧠 Question Clustering</Link>
          <Link to="/analytics">📊 Learning Analytics</Link>
          <Link to="/model">⚙️ Model</Link>
          <Link to="/about">ℹ️ About</Link>

          <span onClick={handleLogout} style={{ cursor: "pointer" }}>
            🚪 Logout
          </span>
        </div>

        <div className="main">
          <div className="topbar">
            <div>
              <h1 className="page-title">Question Clustering Dashboard</h1>
              <p className="page-subtitle">
                Analyze subject clusters, discover learning patterns, and monitor student question behavior
              </p>
            </div>

            <div className="user-info">
              {user ? `${user.name || "User"} | ${user.role || "Student"}` : "User"}
            </div>
          </div>

          <div className="hero-banner">
            <div className="hero-banner-left">
              <span className="hero-badge">Learning Pattern Overview</span>
              <h2>Understand how questions are grouped and how users learn</h2>
              <p>
                This dashboard helps you monitor clustered questions, identify
                important subjects, detect weaker learning areas, and understand
                how well the system is organizing academic patterns.
              </p>

              <div className="hero-buttons">
                <button
                  className="primary-btn"
                  onClick={loadDashboardData}
                  disabled={loading}
                  type="button"
                >
                  {loading ? "Refreshing..." : "Refresh Insights"}
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

            <div className="hero-banner-right">
              <div className="hero-circle">🧠</div>
              <div className="hero-mini-card">
                <h4>Main Learning Area</h4>
                <p>
                  {dashboardInsights.topTopic
                    ? dashboardInsights.topTopic.category
                    : "No data"}
                </p>
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
              <h3>{loading ? "..." : `${dashboardInsights.labelCoverage}%`}</h3>
              <p>Pattern Coverage</p>
            </div>

            <div className="stat-card">
              <h3>{loading ? "..." : dashboardInsights.learningStage}</h3>
              <p>Learning Stage</p>
            </div>
          </div>

          <div className="section">
            <h2>Student Learning Insights</h2>
            <div className="feature-grid">
              <div className="feature-card">
                <h3>📚 Subject Focus</h3>
                <p>
                  Detect which subject or topic receives the highest number of
                  questions, showing where student attention is strongest.
                </p>
              </div>

              <div className="feature-card">
                <h3>🧠 Learning Pattern Detection</h3>
                <p>
                  Group similar questions together to understand recurring learning
                  behavior and concept repetition.
                </p>
              </div>

              <div className="feature-card">
                <h3>🎯 Revision Guidance</h3>
                <p>
                  Use weak and low-frequency clusters to identify where revision,
                  explanation, or more examples are needed.
                </p>
              </div>
            </div>
          </div>

          <div className="section">
            <h2>Learning Workflow</h2>
            <div className="workflow-grid">
              <div className="workflow-card">
                <span>1</span>
                <h4>Upload Questions</h4>
                <p>Add academic questions from files and build the question dataset.</p>
              </div>

              <div className="workflow-card">
                <span>2</span>
                <h4>Cluster Similar Questions</h4>
                <p>Group repeated and concept-related questions into meaningful clusters.</p>
              </div>

              <div className="workflow-card">
                <span>3</span>
                <h4>Detect Learning Pattern</h4>
                <p>Observe which topics dominate and which areas show lower engagement.</p>
              </div>

              <div className="workflow-card">
                <span>4</span>
                <h4>Improve Study Direction</h4>
                <p>Use the insights to guide revision, teaching focus, and better preparation.</p>
              </div>
            </div>
          </div>

          <div className="section">
            <h2>Model & Pattern Engine</h2>
            <div className="model-grid">
              <div className="model-card">
                <h4>Classifier Status</h4>
                <p>{modelStatus.classifier_trained ? "Ready" : "Not Ready"}</p>
              </div>

              <div className="model-card">
                <h4>Sentence Transformer</h4>
                <p>{modelStatus.uses_sentence_transformer ? "Enabled" : "Disabled"}</p>
              </div>

              <div className="model-card">
                <h4>Logistic Regression</h4>
                <p>{modelStatus.uses_logistic_regression ? "Enabled" : "Disabled"}</p>
              </div>

              <div className="model-card">
                <h4>Total Categories</h4>
                <p>{loading ? "..." : stats.total_categories}</p>
              </div>
            </div>
          </div>

          <div className="section">
            <h2>Smart Summary</h2>
            <div className="summary-box">
              <p>
                {stats.total_questions === 0
                  ? "No question data is available yet. Upload files and begin clustering to generate learning insights."
                  : `Your system currently contains ${stats.total_questions} questions across ${stats.total_categories} categories. The most active topic is ${
                      dashboardInsights.topTopic
                        ? dashboardInsights.topTopic.category
                        : "not available yet"
                    }. Pattern coverage is ${dashboardInsights.labelCoverage}%, and the current revision priority is ${dashboardInsights.revisionPriority}.`}
              </p>
            </div>
          </div>

          <div className="footer-note">
            <p>
              SmartCluster is now presented as a learning intelligence dashboard —
              focused on question grouping, subject behavior, and student learning patterns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;