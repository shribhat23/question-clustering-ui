import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Model.css";

const steps = [
  {
    title: "File Upload & Text Extraction",
    brief:
      "The system accepts files and reads text from different formats.",
    example:
      "Example: A PDF, DOCX, or TXT file containing exam questions is uploaded and converted into plain text.",
    icon: "📂",
  },
  {
    title: "Question Extraction",
    brief:
      "Rule-based logic identifies valid questions from the uploaded content.",
    example:
      "Example: 'Explain OSI model' and 'What is Python?' are extracted as valid questions.",
    icon: "❓",
  },
  {
    title: "Text Normalization",
    brief:
      "Questions are cleaned for consistent comparison and storage.",
    example:
      "Example: 'What is Python?' becomes 'what is python'.",
    icon: "🧹",
  },
  {
    title: "Duplicate Removal",
    brief:
      "Repeated questions are removed mainly through normalized duplicate checking, with similarity-based support in the system.",
    example:
      "Example: If the same question appears multiple times, only one clean version is kept.",
    icon: "♻️",
  },
  {
    title: "Sentence Embedding",
    brief:
      "Each question is converted into a vector representation using NLP embeddings.",
    example:
      "Example: 'What is AI?' is converted into a numerical meaning-based vector.",
    icon: "🧠",
  },
  {
    title: "Semantic Similarity",
    brief:
      "Cosine similarity is used to detect questions with similar meaning.",
    example:
      "Example: 'Define AI' and 'What is Artificial Intelligence?' are recognized as similar.",
    icon: "🔗",
  },
  {
    title: "Rule-Based Topic Detection",
    brief:
      "Subject keywords are used to strongly identify relevant topics.",
    example:
      "Example: 'python list and tuple' is strongly matched with the Python topic.",
    icon: "🏷️",
  },
  {
    title: "Prototype-Based Classification",
    brief:
      "Questions are compared with subject prototype patterns to find the closest topic.",
    example:
      "Example: A question about derivatives is matched with the Mathematics prototype.",
    icon: "🎯",
  },
  {
    title: "Machine Learning Classification",
    brief:
      "A Logistic Regression model improves topic prediction using stored data.",
    example:
      "Example: Based on trained database questions, the system predicts the question belongs to DBMS.",
    icon: "🤖",
  },
  {
    title: "Keyword Boosting",
    brief:
      "Important keywords increase the confidence of the predicted topic.",
    example:
      "Example: 'SQL query' boosts the DBMS category score.",
    icon: "🚀",
  },
  {
    title: "Topic Assignment",
    brief:
      "The system assigns the most suitable final subject category.",
    example:
      "Example: A question is finally labeled as Machine Learning or Operating System.",
    icon: "✅",
  },
  {
    title: "Clustering by Topic",
    brief:
      "Questions are grouped into topic-based clusters using semantic understanding and subject prediction.",
    example:
      "Example: All Python-related questions are grouped into one cluster.",
    icon: "🗂️",
  },
  {
    title: "Database Storage",
    brief:
      "Processed questions and their categories are stored in the database.",
    example:
      "Example: Question text, normalized form, and predicted topic are saved for future use.",
    icon: "💾",
  },
  {
    title: "Dashboard & Analytics",
    brief:
      "Clustered results are used to show patterns and learning insights in the UI.",
    example:
      "Example: The dashboard shows that Python has 40% of the uploaded questions.",
    icon: "📊",
  },
];

const technologies = [
  "React.js",
  "Flask",
  "SentenceTransformer",
  "Cosine Similarity",
  "Logistic Regression",
  "Rule-Based NLP",
  "SQLite / MySQL",
  "Semantic Matching",
];

function Model() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  return (
    <div className="model-layout">
      <aside className="sidebar">
        <h2>SmartCluster</h2>

        <Link to="/home">🏠 Home</Link>
        <Link to="/dashboard">📁 Dashboard</Link>
        <Link to="/clustering">🧠 Question Clustering</Link>
        <Link to="/analytics">📊 Learning Analytics</Link>
        <Link to="/model" className="active-link">
          ⚙️ Model
        </Link>
        <Link to="/about">ℹ️ About</Link>

        <span onClick={handleLogout}>🚪 Logout</span>
      </aside>

      <main className="model-page">
        <div className="model-container">
          <section className="model-hero">
            <div className="model-hero-left">
              <span className="model-badge">Project Intelligence Module</span>
              <h1 className="model-title">
                NLP-Based Question Clustering & Topic Detection Model
              </h1>
              <p className="model-subtitle">
                This module explains how the project reads uploaded question files,
                removes duplicates, predicts subject categories, and groups similar
                questions using rule-based logic, semantic similarity, and machine
                learning.
              </p>

              <div className="hero-points">
                <div className="hero-point">Hybrid NLP + ML Approach</div>
                <div className="hero-point">Duplicate-Free Question Bank</div>
                <div className="hero-point">Topic-Based Grouping for Analysis</div>
              </div>
            </div>

            <div className="model-hero-right">
              <div className="hero-image-card">
                <img
                  src={process.env.PUBLIC_URL + "/clustering-diagram.png"}
                  alt="Question clustering workflow"
                  className="model-image"
                />
              </div>
            </div>
          </section>

          <section className="model-highlight-grid">
            <div className="highlight-card">
              <h3>Smart Input</h3>
              <p>Supports TXT, CSV, JSON, PDF, DOCX, MD, and LOG files.</p>
            </div>

            <div className="highlight-card">
              <h3>Hybrid Detection</h3>
              <p>Combines keyword rules, semantic similarity, and ML prediction.</p>
            </div>

            <div className="highlight-card">
              <h3>Meaning-Based Grouping</h3>
              <p>
                Groups questions into topic-based clusters using semantic
                understanding and subject prediction.
              </p>
            </div>
          </section>

          <section className="model-section">
            <div className="section-head">
              <span className="section-tag">Core Workflow</span>
              <h2 className="section-title">How the Model Works</h2>
              <p className="section-subtitle">
                Each step below shows the project pipeline in a brief and clear way,
                along with a simple example.
              </p>
            </div>

            <div className="steps-grid">
              {steps.map((step, index) => (
                <div key={index} className="step-card">
                  <div className="step-top">
                    <div className="step-icon">{step.icon}</div>
                    <div className="step-number">Step {index + 1}</div>
                  </div>

                  <h3 className="step-card-title">{step.title}</h3>
                  <p className="step-brief">{step.brief}</p>

                  <div className="step-example-box">
                    <span className="example-label">Example</span>
                    <p className="step-example">{step.example}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="model-section">
            <div className="section-head">
              <span className="section-tag">Tech Stack</span>
              <h2 className="section-title">Technologies Used</h2>
            </div>

            <div className="tech-pill-wrap">
              {technologies.map((tech, index) => (
                <div key={index} className="tech-pill">
                  {tech}
                </div>
              ))}
            </div>
          </section>

          <section className="model-section">
            <div className="section-head">
              <span className="section-tag">Why This Is Advanced</span>
              <h2 className="section-title">Project Strength</h2>
            </div>

            <div className="strength-grid">
              <div className="strength-card">
                <h3>Not Just File Upload</h3>
                <p>
                  The system extracts and processes meaningful academic questions intelligently.
                </p>
              </div>

              <div className="strength-card">
                <h3>Not Just Keyword Matching</h3>
                <p>
                  The model understands semantic meaning using embeddings and similarity.
                </p>
              </div>

              <div className="strength-card">
                <h3>Complete Learning System</h3>
                <p>
                  It predicts topics, removes duplicates, clusters questions, and generates insights.
                </p>
              </div>
            </div>
          </section>

          <section className="model-section">
            <div className="section-head">
              <span className="section-tag">Final Note</span>
              <h2 className="section-title">Project Summary</h2>
            </div>

            <div className="summary-box">
              <p>
                This project is a hybrid intelligent academic system that combines
                <strong> rule-based NLP</strong>, <strong>SentenceTransformer embeddings</strong>,
                <strong> cosine similarity</strong>, and <strong>Logistic Regression</strong> to
                organize uploaded questions into meaningful topic-based groups. It helps
                create a structured question bank and generates useful learning
                insights through an interactive user interface.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Model;