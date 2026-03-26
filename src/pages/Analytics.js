import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import "../styles/Analytics.css";

const API_BASE = "http://127.0.0.1:5000";

function Analytics() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [analyticsData, setAnalyticsData] = useState({
    summary: {
      total_time_spent_seconds: 0,
      total_questions_viewed: 0,
      total_subjects_seen: 0,
      avg_time_per_question: 0,
    },
    subject_usage: [],
    daily_usage: [],
    difficulty_pattern: [],
    recent_activity: [],
  });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    setUser(storedUser);
  }, []);

  useEffect(() => {
    if (user?.name) {
      loadAnalyticsData(user.name);
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadAnalyticsData = async (userName) => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE}/user-analytics?user_name=${encodeURIComponent(userName)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load analytics");
      }

      setAnalyticsData({
        summary: {
          total_time_spent_seconds: data.summary?.total_time_spent_seconds || 0,
          total_questions_viewed: data.summary?.total_questions_viewed || 0,
          total_subjects_seen: data.summary?.total_subjects_seen || 0,
          avg_time_per_question: data.summary?.avg_time_per_question || 0,
        },
        subject_usage: Array.isArray(data.subject_usage) ? data.subject_usage : [],
        daily_usage: Array.isArray(data.daily_usage) ? data.daily_usage : [],
        difficulty_pattern: Array.isArray(data.difficulty_pattern)
          ? data.difficulty_pattern
          : [],
        recent_activity: Array.isArray(data.recent_activity)
          ? data.recent_activity
          : [],
      });
    } catch (error) {
      console.error("Analytics load error:", error);
      alert(error.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const chartColors = useMemo(
    () => ["#2563eb", "#60a5fa", "#93c5fd", "#1d4ed8", "#3b82f6", "#bfdbfe"],
    []
  );

  const computedStats = useMemo(() => {
    const totalSeconds = analyticsData.summary.total_time_spent_seconds || 0;
    const totalMinutes = Math.round(totalSeconds / 60);

    const mostViewedSubject =
      analyticsData.subject_usage.length > 0
        ? analyticsData.subject_usage.reduce((max, item) =>
            (item.questions_viewed || 0) > (max.questions_viewed || 0)
              ? item
              : max
          )
        : null;

    const mostTimeSpentSubject =
      analyticsData.subject_usage.length > 0
        ? analyticsData.subject_usage.reduce((max, item) =>
            (item.total_time_spent || 0) > (max.total_time_spent || 0)
              ? item
              : max
          )
        : null;

    return {
      totalMinutes,
      mostViewedSubject,
      mostTimeSpentSubject,
    };
  }, [analyticsData]);

  const formattedDailyUsage = useMemo(() => {
    return analyticsData.daily_usage.map((item) => ({
      ...item,
      total_time_spent_minutes: Math.round((item.total_time_spent || 0) / 60),
    }));
  }, [analyticsData.daily_usage]);

  return (
    <div className="analytics-page">
      <div className="analytics-body">
        <div className="sidebar">
          <h2>SmartCluster</h2>

          <Link to="/home">🏠 Home</Link>
          <Link to="/dashboard">📂 Dashboard</Link>
          <Link to="/clustering">🧠 Question Clustering</Link>
          <Link to="/analytics" className="active-link">
            📊 Learning Analytics
          </Link>
          <Link to="/model">⚙️ Model</Link>
          <Link to="/about">ℹ️ About</Link>

          <span onClick={handleLogout} style={{ cursor: "pointer" }}>
            🚪 Logout
          </span>
        </div>

        <div className="main">
          <div className="topbar">
            <div>
              <h1 className="page-title">Learning Analytics</h1>
              <p className="page-subtitle">
                Analyze user learning behavior, viewed questions, time spent,
                and subject interest with interactive charts.
              </p>
            </div>

            <div className="user-info">
              {user ? `${user.name || "User"} | ${user.role || "Student"}` : "User"}
            </div>
          </div>

          <div className="analytics-hero">
            <div className="analytics-hero-left">
              <span className="analytics-badge">Graph Analyzer</span>
              <h2>Understand how users learn from clustered questions</h2>
              <p>
                This page tracks user engagement across subjects, learning
                patterns, time spent, and question exploration to make your
                SmartCluster project more intelligent and interactive.
              </p>

              <div className="hero-actions">
                <button
                  className="primary-btn"
                  onClick={() => loadAnalyticsData(user?.name)}
                  disabled={loading || !user?.name}
                  type="button"
                >
                  {loading ? "Refreshing..." : "Refresh Analytics"}
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

            <div className="analytics-hero-right">
              <div className="analytics-orb">📈</div>
              <div className="readiness-card">
                <h4>Top Interest</h4>
                <p>
                  {computedStats.mostViewedSubject
                    ? computedStats.mostViewedSubject.subject
                    : "No data"}
                </p>
              </div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <h3>{loading ? "..." : computedStats.totalMinutes}</h3>
              <p>Total Minutes Spent</p>
            </div>

            <div className="stat-card">
              <h3>{loading ? "..." : analyticsData.summary.total_questions_viewed}</h3>
              <p>Questions Viewed</p>
            </div>

            <div className="stat-card">
              <h3>{loading ? "..." : analyticsData.summary.total_subjects_seen}</h3>
              <p>Subjects Explored</p>
            </div>

            <div className="stat-card">
              <h3>{loading ? "..." : analyticsData.summary.avg_time_per_question}</h3>
              <p>Avg Seconds / Question</p>
            </div>
          </div>

          <div className="insight-grid">
            <div className="insight-card">
              <h3>Most Viewed Subject</h3>
              <p className="big-text">
                {computedStats.mostViewedSubject
                  ? computedStats.mostViewedSubject.subject
                  : "N/A"}
              </p>
              <span>
                {computedStats.mostViewedSubject
                  ? `${computedStats.mostViewedSubject.questions_viewed} question(s)`
                  : "No data available"}
              </span>
            </div>

            <div className="insight-card">
              <h3>Most Time Spent</h3>
              <p className="big-text">
                {computedStats.mostTimeSpentSubject
                  ? computedStats.mostTimeSpentSubject.subject
                  : "N/A"}
              </p>
              <span>
                {computedStats.mostTimeSpentSubject
                  ? `${computedStats.mostTimeSpentSubject.total_time_spent} sec`
                  : "No data available"}
              </span>
            </div>

            <div className="insight-card">
              <h3>Learning Pattern</h3>
              <p className="big-text">
                {analyticsData.difficulty_pattern.length > 0
                  ? analyticsData.difficulty_pattern[0]?.difficulty
                  : "N/A"}
              </p>
              <span>Most attempted difficulty level</span>
            </div>

            <div className="insight-card">
              <h3>Engagement Status</h3>
              <p className="big-text">
                {analyticsData.summary.total_questions_viewed >= 20
                  ? "High"
                  : analyticsData.summary.total_questions_viewed >= 8
                  ? "Medium"
                  : "Low"}
              </p>
              <span>Based on viewed questions and time spent</span>
            </div>
          </div>

          <div className="chart-grid">
            <div className="section chart-section">
              <h2>Subject-wise Questions Viewed</h2>
              <div className="chart-box">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={analyticsData.subject_usage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="questions_viewed"
                      name="Questions Viewed"
                      fill="#2563eb"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="section chart-section">
              <h2>Learning Pattern Distribution</h2>
              <div className="chart-box">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={analyticsData.difficulty_pattern}
                      dataKey="count"
                      nameKey="difficulty"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {analyticsData.difficulty_pattern.map((entry, index) => (
                        <Cell
                          key={`difficulty-${index}`}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="chart-grid">
            <div className="section chart-section">
              <h2>Subject-wise Time Spent</h2>
              <div className="chart-box">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={analyticsData.subject_usage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="total_time_spent"
                      name="Time Spent (sec)"
                      fill="#60a5fa"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="section chart-section">
              <h2>Daily Learning Trend</h2>
              <div className="chart-box">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={formattedDailyUsage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="view_date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="questions_viewed"
                      name="Questions Viewed"
                      stroke="#2563eb"
                      strokeWidth={3}
                    />
                    <Line
                      type="monotone"
                      dataKey="total_time_spent_minutes"
                      name="Time Spent (min)"
                      stroke="#60a5fa"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="section">
            <h2>Subject Interest Summary</h2>
            {analyticsData.subject_usage.length > 0 ? (
              <div className="subject-summary-grid">
                {analyticsData.subject_usage.slice(0, 6).map((item, index) => (
                  <div className="subject-summary-card" key={`${item.subject}-${index}`}>
                    <h4>{item.subject}</h4>
                    <p>{item.questions_viewed} question(s) viewed</p>
                    <span>{item.total_time_spent} sec spent</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-card">
                <h4>No analytics data available</h4>
                <p>Start viewing clustered questions to generate learning analytics.</p>
              </div>
            )}
          </div>

          <div className="section">
            <h2>Recent Learning Activity</h2>
            {analyticsData.recent_activity.length > 0 ? (
              <div className="activity-list">
                {analyticsData.recent_activity.map((item, index) => (
                  <div className="activity-item" key={index}>
                    <div className="activity-left">
                      <h4>{item.subject || "Others"}</h4>
                      <p>{item.question_text || "No question text"}</p>
                    </div>

                    <div className="activity-meta">
                      <span>{item.time_spent_seconds || 0} sec</span>
                      <small>
                        {item.viewed_at
                          ? new Date(item.viewed_at).toLocaleString()
                          : "No date"}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-card">
                <h4>No recent activity</h4>
                <p>User actions will appear here after tracking starts.</p>
              </div>
            )}
          </div>

          <div className="section">
            <h2>Smart Insights</h2>
            <div className="recommendation-list">
              <div className="recommendation-item">
                <span>1</span>
                <p>
                  {computedStats.mostViewedSubject
                    ? `User is most interested in ${computedStats.mostViewedSubject.subject}.`
                    : "No dominant subject has been detected yet."}
                </p>
              </div>

              <div className="recommendation-item">
                <span>2</span>
                <p>
                  {analyticsData.summary.avg_time_per_question > 30
                    ? "Users are spending good time per question, showing deeper engagement."
                    : "Average time per question is low, so users may be skimming quickly."}
                </p>
              </div>

              <div className="recommendation-item">
                <span>3</span>
                <p>
                  {analyticsData.summary.total_subjects_seen >= 4
                    ? "Users are exploring multiple subjects, which suggests broader learning behavior."
                    : "Users are focusing on fewer subjects, which may indicate narrow learning interest."}
                </p>
              </div>

              <div className="recommendation-item">
                <span>4</span>
                <p>
                  Use this graph analyzer to identify which clustered subjects attract
                  more attention and where users spend most of their study time.
                </p>
              </div>
            </div>
          </div>

          <div className="footer-note">
            <p>
              Learning Analytics helps SmartCluster go beyond question grouping by
              showing how users interact with clustered academic content.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;