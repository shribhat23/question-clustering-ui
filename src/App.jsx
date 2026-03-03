import { useState } from "react";

function App() {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: "Segoe UI", sans-serif;
        }

        body {
          background: #ffffff;
          color: #000;
        }

        .navbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 40px;
          background: #000;
          color: #fff;
        }

        .logo {
          font-size: 28px;
          font-weight: bold;
        }

        .nav-links a {
          color: #fff;
          text-decoration: none;
          margin: 0 10px;
          padding: 8px 16px;
          border-radius: 20px;
          background: #1f1f1f;
          font-size: 14px;
          cursor: pointer;
        }

        .nav-links a:hover {
          background: #333;
        }

        .auth-buttons {
          display: flex;
          gap: 12px;
        }

        .login-btn {
          padding: 8px 18px;
          border-radius: 20px;
          background: transparent;
          border: 1px solid #fff;
          color: #fff;
          cursor: pointer;
        }

        .signup-btn {
          padding: 8px 18px;
          border-radius: 20px;
          background: #4aa3df;
          border: none;
          color: #fff;
          cursor: pointer;
        }

        .hero {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 90px 60px;
          gap: 80px;
        }

        .hero-left img {
          width: 220px;
          height: 220px;
          border-radius: 50%;
        }

        .hero-right h1 {
          font-size: 56px;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 20px;
        }

        .hero-right p {
          font-size: 18px;
          color: #444;
        }

        .about {
          padding: 80px 60px;
          background: #f7f7f7;
        }

        .about h2 {
          font-size: 36px;
          margin-bottom: 20px;
        }

        .about p {
          font-size: 16px;
          max-width: 900px;
          line-height: 1.6;
          margin-bottom: 15px;
        }

        .features {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-top: 25px;
        }

        .feature {
          background: #fff;
          border: 1px solid #ddd;
          padding: 14px 18px;
          border-radius: 8px;
          font-size: 14px;
        }

        .author {
          position: fixed;
          bottom: 20px;
          left: 30px;
          font-size: 14px;
        }

        .author a {
          color: #4aa3df;
          text-decoration: none;
        }

        @media (max-width: 900px) {
          .hero {
            flex-direction: column;
            text-align: center;
          }

          .hero-right h1 {
            font-size: 40px;
          }
        }
      `}</style>

      {/* NAVBAR */}
      <header className="navbar">
        <div className="logo">SmartCluster</div>

        <nav className="nav-links">
          <a onClick={() => setShowAbout(false)}>Home</a>
          <a href="/dashboard.html">Dashboard</a>
          <a onClick={() => setShowAbout(true)}>About</a>
        </nav>

        <div className="auth-buttons">
          <button className="login-btn">Login</button>
          <button className="signup-btn">Sign Up</button>
        </div>
      </header>

      {/* HERO SECTION */}
      {!showAbout && (
        <section className="hero">
          <div className="hero-left">
            <img
              src="https://via.placeholder.com/300"
              alt="Profile"
            />
          </div>

          <div className="hero-right">
            <h1>
              Smart Question
              <br />
              Clustering Dashboard
            </h1>
            <p>
              MCA Mini Project – Machine Learning & NLP Based Academic Question
              Clustering
            </p>
          </div>
        </section>
      )}

      {/* ABOUT SECTION */}
      {showAbout && (
        <section className="about">
          <h2>About This Project</h2>

          <p>
            This Smart Question Clustering system is an MCA mini project that
            uses Machine Learning and Natural Language Processing techniques to
            group similar academic questions automatically.
          </p>

          <p>
            The system helps teachers identify representative questions and
            assign remaining ones as practice questions for students.
          </p>

          <div className="features">
            <div className="feature">NLP-Based Similarity</div>
            <div className="feature">Sentence Embeddings</div>
            <div className="feature">K-Means Clustering</div>
            <div className="feature">MySQL Database</div>
            <div className="feature">Web Dashboard</div>
          </div>
        </section>
      )}

      {/* AUTHOR */}
      <div className="author">
        <strong>AUTHOR:</strong> <a href="#">Your Name (MCA)</a>
      </div>
    </>
  );
}

export default App;