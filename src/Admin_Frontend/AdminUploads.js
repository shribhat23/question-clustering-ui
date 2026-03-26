import React, { useState, useEffect, useRef } from "react";
import "../styles/AdminUploads.css";

const API_BASE = "http://127.0.0.1:5000";

function AdminUploads() {
  const [uploadMessage, setUploadMessage] = useState("");
  const [questionMessage, setQuestionMessage] = useState("");
  const [manageMessage, setManageMessage] = useState("");
  const [modelMessage, setModelMessage] = useState("");

  const [files, setFiles] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState("");
  const [category, setCategory] = useState("Auto");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [activeSection, setActiveSection] = useState("overview");

  const [backendConnected, setBackendConnected] = useState(true);
  const [backendStatusMessage, setBackendStatusMessage] = useState("");

  const [modelStatus, setModelStatus] = useState({
    classifier_trained: false,
    topic_counts: [],
    uses_sentence_transformer: true,
    uses_logistic_regression: false
  });

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const clearMessages = () => {
    setUploadMessage("");
    setQuestionMessage("");
    setManageMessage("");
    setModelMessage("");
  };

  const changeSection = (section) => {
    clearMessages();
    setActiveSection(section);
  };

  const buildErrorMessage = (error, fallback) => {
    if (!error) return fallback;

    const msg = String(error.message || error);

    if (msg.includes("Failed to fetch")) {
      return "Unable to connect to backend. Check Flask server, API URL, and CORS settings.";
    }

    if (msg.includes("Invalid response")) {
      return "Backend returned an invalid response.";
    }

    return msg || fallback;
  };

  const safeJson = async (response) => {
    try {
      return await response.json();
    } catch {
      throw new Error("Invalid response from server");
    }
  };

  const apiFetch = async (path, options = {}) => {
    const response = await fetch(`${API_BASE}${path}`, options);

    let data = null;
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || "Server request failed");
      }
      return { ok: true, data: text };
    }

    if (!response.ok) {
      throw new Error(data?.error || data?.message || "Server request failed");
    }

    return { ok: true, data };
  };

  const checkBackend = async () => {
    try {
      const response = await fetch(`${API_BASE}/`, { method: "GET" });
      const text = await response.text();

      if (response.ok) {
        setBackendConnected(true);
        setBackendStatusMessage("");
      } else {
        setBackendConnected(false);
        setBackendStatusMessage("Backend is reachable but returned an unexpected response.");
      }

      return response.ok && text;
    } catch (error) {
      setBackendConnected(false);
      setBackendStatusMessage(
        "Backend is not reachable. Start Flask server and verify API URL."
      );
      return null;
    }
  };

  const fetchFiles = async () => {
    try {
      const { data } = await apiFetch("/files");
      setBackendConnected(true);
      setBackendStatusMessage("");

      if (data.uploaded_files) {
        setFiles(data.uploaded_files);
      } else {
        setFiles([]);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      setFiles([]);
      setBackendConnected(false);
      setBackendStatusMessage(buildErrorMessage(error, "Could not load files."));
    }
  };

  const fetchQuestions = async () => {
    try {
      const { data } = await apiFetch("/questions");
      setBackendConnected(true);
      setBackendStatusMessage("");

      if (Array.isArray(data)) {
        setQuestions(data);
      } else {
        setQuestions([]);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      setQuestions([]);
      setBackendConnected(false);
      setBackendStatusMessage(buildErrorMessage(error, "Could not load questions."));
    }
  };

  const fetchModelStatus = async () => {
    try {
      const { data } = await apiFetch("/model-status");
      setBackendConnected(true);
      setBackendStatusMessage("");

      setModelStatus({
        classifier_trained: !!data.classifier_trained,
        topic_counts: Array.isArray(data.topic_counts) ? data.topic_counts : [],
        uses_sentence_transformer: !!data.uses_sentence_transformer,
        uses_logistic_regression: !!data.uses_logistic_regression
      });
    } catch (error) {
      console.error("Error fetching model status:", error);
      setBackendConnected(false);
      setBackendStatusMessage(buildErrorMessage(error, "Could not load model status."));
      setModelStatus({
        classifier_trained: false,
        topic_counts: [],
        uses_sentence_transformer: true,
        uses_logistic_regression: false
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      await checkBackend();
      await fetchFiles();
      await fetchQuestions();
      await fetchModelStatus();
    };

    init();
  }, []);

  const refreshAll = async () => {
    await checkBackend();
    await fetchFiles();
    await fetchQuestions();
    await fetchModelStatus();
  };

  const mergeSelectedFiles = (incomingFiles) => {
    const existingMap = new Map();

    selectedFiles.forEach((file) => {
      const key = `${file.name}_${file.size}_${file.lastModified}`;
      existingMap.set(key, file);
    });

    Array.from(incomingFiles).forEach((file) => {
      const key = `${file.name}_${file.size}_${file.lastModified}`;
      if (!existingMap.has(key)) {
        existingMap.set(key, file);
      }
    });

    setSelectedFiles(Array.from(existingMap.values()));
  };

  const handleFileSelection = (e) => {
    setUploadMessage("");
    const chosenFiles = e.target.files;

    if (chosenFiles && chosenFiles.length > 0) {
      mergeSelectedFiles(chosenFiles);
    }
  };

  const removeSelectedFile = (indexToRemove) => {
    setSelectedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (folderInputRef.current) {
      folderInputRef.current.value = "";
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    setUploadMessage("");
    setQuestionMessage("");
    setManageMessage("");
    setModelMessage("");

    if (selectedFiles.length === 0) {
      setUploadMessage("Please choose file(s) or folder");
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const { data } = await apiFetch("/upload", {
        method: "POST",
        body: formData
      });

      setBackendConnected(true);
      setBackendStatusMessage("");

      let finalMessage = data.message || "Files uploaded successfully";

      if (typeof data.questions_found === "number") {
        finalMessage += ` | Questions Found: ${data.questions_found}`;
      }

      if (typeof data.stored_in_db === "number") {
        finalMessage += ` | Stored: ${data.stored_in_db}`;
      }

      if (typeof data.duplicates_found === "number") {
        finalMessage += ` | Duplicates: ${data.duplicates_found}`;
      }

      if (typeof data.clusters_created === "number") {
        finalMessage += ` | Clusters: ${data.clusters_created}`;
      }

      setUploadMessage(finalMessage);
      clearSelectedFiles();
      await refreshAll();
    } catch (error) {
      console.error("Upload error:", error);
      setBackendConnected(false);
      setBackendStatusMessage(buildErrorMessage(error, "Upload failed."));
      setUploadMessage(buildErrorMessage(error, "Error while uploading files"));
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setUploadMessage("");
    setQuestionMessage("");
    setManageMessage("");
    setModelMessage("");

    if (!questionText.trim()) {
      setQuestionMessage("Question is required");
      return;
    }

    try {
      const { data } = await apiFetch("/add-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question_text: questionText.trim(),
          category: category
        })
      });

      setBackendConnected(true);
      setBackendStatusMessage("");

      let finalMessage = data.message || "Question added successfully";

      if (data.assigned_category) {
        finalMessage += ` | Assigned Category: ${data.assigned_category}`;
      }

      if (data.deleted_old_duplicates_count > 0) {
        finalMessage += ` | ${data.deleted_old_duplicates_count} old similar question(s) removed`;
      }

      if (Array.isArray(data.deleted_old_questions) && data.deleted_old_questions.length > 0) {
        finalMessage += ` | Removed: ${data.deleted_old_questions.join(" | ")}`;
      }

      setQuestionMessage(finalMessage);
      setQuestionText("");
      setCategory("Auto");
      await refreshAll();
    } catch (error) {
      console.error("Add question error:", error);
      setBackendConnected(false);
      setBackendStatusMessage(buildErrorMessage(error, "Add question failed."));
      setQuestionMessage(buildErrorMessage(error, "Error while adding question"));
    }
  };

  const handleDeleteQuestion = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this question?");
    if (!confirmDelete) return;

    setManageMessage("");
    setUploadMessage("");
    setQuestionMessage("");
    setModelMessage("");

    try {
      const { data } = await apiFetch(`/delete-question/${id}`, {
        method: "DELETE"
      });

      setBackendConnected(true);
      setBackendStatusMessage("");
      setManageMessage(data.message || "Question deleted");
      await refreshAll();
    } catch (error) {
      console.error("Delete question error:", error);
      setBackendConnected(false);
      setBackendStatusMessage(buildErrorMessage(error, "Delete question failed."));
      setManageMessage(buildErrorMessage(error, "Error while deleting question"));
    }
  };

  const handleDeleteFile = async (filename) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this file?");
    if (!confirmDelete) return;

    setManageMessage("");
    setUploadMessage("");
    setQuestionMessage("");
    setModelMessage("");

    try {
      const { data } = await apiFetch(`/delete-file/${encodeURIComponent(filename)}`, {
        method: "DELETE"
      });

      setBackendConnected(true);
      setBackendStatusMessage("");
      setManageMessage(data.message || "File deleted successfully");
      await refreshAll();
    } catch (error) {
      console.error("Delete file error:", error);
      setBackendConnected(false);
      setBackendStatusMessage(buildErrorMessage(error, "Delete file failed."));
      setManageMessage(buildErrorMessage(error, "Error while deleting file"));
    }
  };

  const handleAutoLabelDb = async () => {
    setModelMessage("");
    setUploadMessage("");
    setQuestionMessage("");
    setManageMessage("");

    try {
      const { data } = await apiFetch("/auto-label-db", {
        method: "POST"
      });

      setBackendConnected(true);
      setBackendStatusMessage("");

      let msg = data.message || "Database auto-labeled successfully";

      if (typeof data.updated_count === "number") {
        msg += ` | Updated: ${data.updated_count}`;
      }

      if (typeof data.classifier_trained === "boolean") {
        msg += data.classifier_trained
          ? " | Classifier Trained"
          : " | Classifier Not Trained Yet";
      }

      setModelMessage(msg);
      await refreshAll();
    } catch (error) {
      console.error("Auto-label DB error:", error);
      setBackendConnected(false);
      setBackendStatusMessage(buildErrorMessage(error, "Auto label failed."));
      setModelMessage(buildErrorMessage(error, "Error while auto-labeling database"));
    }
  };

  const handleCleanupDuplicates = async () => {
    setModelMessage("");
    setUploadMessage("");
    setQuestionMessage("");
    setManageMessage("");

    try {
      const { data } = await apiFetch("/cleanup-duplicates", {
        method: "DELETE"
      });

      setBackendConnected(true);
      setBackendStatusMessage("");

      let msg = data.message || "Duplicate cleanup completed";

      if (typeof data.semantic_deleted_count === "number") {
        msg += ` | Semantic Deleted: ${data.semantic_deleted_count}`;
      }

      setManageMessage(msg);
      await refreshAll();
    } catch (error) {
      console.error("Cleanup duplicates error:", error);
      setBackendConnected(false);
      setBackendStatusMessage(buildErrorMessage(error, "Cleanup failed."));
      setManageMessage(buildErrorMessage(error, "Error while cleaning duplicates"));
    }
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="logo-box">SC</div>
          <div>
            <h2>SmartCluster</h2>
            <p>Admin Dashboard</p>
          </div>
        </div>

        <nav className="sidebar-menu">
          <button
            type="button"
            className={activeSection === "overview" ? "active-link" : ""}
            onClick={() => changeSection("overview")}
          >
            <span>📊</span> Overview
          </button>

          <button
            type="button"
            className={activeSection === "uploadQuestion" ? "active-link" : ""}
            onClick={() => changeSection("uploadQuestion")}
          >
            <span>📁</span> Uploads & Questions
          </button>

          <button
            type="button"
            className={activeSection === "files" ? "active-link" : ""}
            onClick={() => changeSection("files")}
          >
            <span>📂</span> Files
          </button>

          <button
            type="button"
            className={activeSection === "manage" ? "active-link" : ""}
            onClick={() => changeSection("manage")}
          >
            <span>⚙️</span> Manage
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="admin-profile">
            <div className="admin-avatar">A</div>
            <div>
              <h4>Admin</h4>
              <p>System Manager</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <div>
            <h1>Welcome, Admin</h1>
            <p>Manage files, questions, and system records from one place</p>
          </div>
          <div className="topbar-badge">
            {modelStatus.classifier_trained ? "Model Trained" : "Model Training Pending"}
          </div>
        </div>

        {!backendConnected && backendStatusMessage && (
          <div className="admin-message">
            {backendStatusMessage}
          </div>
        )}

        {activeSection === "uploadQuestion" && uploadMessage && (
          <div className="admin-message">{uploadMessage}</div>
        )}

        {activeSection === "uploadQuestion" && questionMessage && (
          <div className="admin-message">{questionMessage}</div>
        )}

        {(activeSection === "files" || activeSection === "manage" || activeSection === "overview") &&
          manageMessage && <div className="admin-message">{manageMessage}</div>}

        {(activeSection === "overview" || activeSection === "manage") && modelMessage && (
          <div className="admin-message">{modelMessage}</div>
        )}

        {activeSection === "overview" && (
          <>
            <section className="stats-grid">
              <div className="stat-card blue">
                <div className="stat-icon">📁</div>
                <div>
                  <h3>{files.length}</h3>
                  <p>Total Uploaded Files</p>
                </div>
              </div>

              <div className="stat-card purple">
                <div className="stat-icon">❓</div>
                <div>
                  <h3>{questions.length}</h3>
                  <p>Total Questions</p>
                </div>
              </div>

              <div className="stat-card green">
                <div className="stat-icon">🏷️</div>
                <div>
                  <h3>{questions.filter((q) => q.category && q.category !== "Auto").length}</h3>
                  <p>Labeled Questions</p>
                </div>
              </div>

              <div className="stat-card orange">
                <div className="stat-icon">📚</div>
                <div>
                  <h3>{[...new Set(questions.map((q) => q.category).filter(Boolean))].length}</h3>
                  <p>Total Categories</p>
                </div>
              </div>
            </section>

            <section className="stacked-section">
              <div className="dashboard-card">
                <div className="card-header">
                  <h2>Model Status</h2>
                  <span className="card-tag">
                    {modelStatus.classifier_trained ? "Trained" : "Pending"}
                  </span>
                </div>

                <div className="model-status-box">
                  <p>
                    <strong>Sentence Transformer:</strong>{" "}
                    {modelStatus.uses_sentence_transformer ? "Enabled" : "Disabled"}
                  </p>
                  <p>
                    <strong>Logistic Regression:</strong>{" "}
                    {modelStatus.uses_logistic_regression ? "Enabled" : "Disabled"}
                  </p>
                  <p>
                    <strong>Classifier Trained:</strong>{" "}
                    {modelStatus.classifier_trained ? "Yes" : "No"}
                  </p>

                  <div className="upload-action-row" style={{ marginTop: "14px" }}>
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={handleAutoLabelDb}
                    >
                      Auto Label DB
                    </button>

                    <button
                      type="button"
                      className="primary-btn"
                      onClick={fetchModelStatus}
                    >
                      Refresh Model Status
                    </button>

                    <button
                      type="button"
                      className="primary-btn"
                      onClick={handleCleanupDuplicates}
                    >
                      Cleanup Duplicates
                    </button>
                  </div>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="card-header">
                  <h2>Topic Distribution</h2>
                  <span className="card-tag neutral">Live DB</span>
                </div>

                {modelStatus.topic_counts && modelStatus.topic_counts.length > 0 ? (
                  <div className="table-wrapper">
                    <table className="question-table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modelStatus.topic_counts.map((item, index) => (
                          <tr key={index}>
                            <td>{item.category}</td>
                            <td>{item.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="empty-text">No topic distribution data found</p>
                )}
              </div>
            </section>
          </>
        )}

        {activeSection === "uploadQuestion" && (
          <section className="stacked-section">
            <div className="dashboard-card">
              <div className="card-header">
                <h2>Upload File / Folder</h2>
                <span className="card-tag">Multiple Upload</span>
              </div>

              <form onSubmit={handleUpload}>
                <label className="upload-area">
                  <input
                    ref={fileInputRef}
                    type="file"
                    name="files"
                    className="hidden-file-input"
                    multiple
                    onChange={handleFileSelection}
                  />

                  <input
                    ref={folderInputRef}
                    type="file"
                    className="hidden-file-input"
                    multiple
                    webkitdirectory="true"
                    directory=""
                    onChange={handleFileSelection}
                  />

                  <div className="upload-circle">☁️</div>
                  <h3>Drag and drop your files here</h3>
                  <p>Select multiple files or upload one full folder at once</p>

                  <div className="upload-action-row">
                    <span
                      className="browse-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }}
                    >
                      Browse Files
                    </span>

                    <span
                      className="browse-btn folder-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        folderInputRef.current?.click();
                      }}
                    >
                      Upload Folder
                    </span>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="selected-file-box">
                      <div className="selected-file-title">
                        Selected Items: {selectedFiles.length}
                      </div>

                      <div className="selected-files-list">
                        {selectedFiles.map((file, index) => (
                          <div key={`${file.name}-${index}`} className="selected-file-item">
                            <span className="selected-file-name">
                              {file.webkitRelativePath || file.name}
                            </span>
                            <button
                              type="button"
                              className="remove-selected-btn"
                              onClick={(e) => {
                                e.preventDefault();
                                removeSelectedFile(index);
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        className="clear-files-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          clearSelectedFiles();
                        }}
                      >
                        Clear All
                      </button>
                    </div>
                  )}
                </label>

                <button type="submit" className="primary-btn large-btn">
                  Upload Now
                </button>
              </form>
            </div>

            <div className="dashboard-card">
              <div className="card-header">
                <h2>Add Question</h2>
                <span className="card-tag">Manual Entry</span>
              </div>

              <form onSubmit={handleAddQuestion} className="question-form">
                <input
                  type="text"
                  placeholder="Enter question here"
                  value={questionText}
                  onChange={(e) => {
                    setQuestionText(e.target.value);
                    setQuestionMessage("");
                  }}
                  className="text-input"
                />

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="select-input"
                >
                  <option value="Auto">Auto Detect</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="Python">Python</option>
                  <option value="Java">Java</option>
                  <option value="C Programming">C Programming</option>
                  <option value="C++ Programming">C++ Programming</option>
                  <option value="Object Oriented Programming">Object Oriented Programming</option>
                  <option value="Data Structures">Data Structures</option>
                  <option value="DBMS">DBMS</option>
                  <option value="Operating System">Operating System</option>
                  <option value="Computer Networks">Computer Networks</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Data Mining">Data Mining</option>
                  <option value="Natural Language Processing">Natural Language Processing</option>
                  <option value="Computer Vision">Computer Vision</option>
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Machine Learning">Machine Learning</option>
                  <option value="Big Data">Big Data</option>
                  <option value="Cloud Computing">Cloud Computing</option>
                  <option value="Others">Others</option>
                </select>

                <button type="submit" className="primary-btn">
                  Add Question
                </button>
              </form>
            </div>
          </section>
        )}

        {activeSection === "files" && (
          <section className="dashboard-card">
            <div className="card-header">
              <h2>Uploaded Files</h2>
              <span className="card-tag neutral">Library</span>
            </div>

            {files.length > 0 ? (
              <div className="file-grid">
                {files.map((file, index) => (
                  <div key={index} className="file-card">
                    <div className="file-card-left">
                      <div className="file-card-icon">📄</div>

                      <div className="file-card-text">
                        <h4>{file}</h4>
                        <p>Stored in system</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="delete-file-btn"
                      onClick={() => handleDeleteFile(file)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-text">No uploaded files found</p>
            )}
          </section>
        )}

        {activeSection === "manage" && (
          <section className="dashboard-card">
            <div className="card-header">
              <h2>All Questions</h2>
              <span className="card-tag danger">Manage Records</span>
            </div>

            <div className="upload-action-row" style={{ marginBottom: "16px" }}>
              <button
                type="button"
                className="primary-btn"
                onClick={handleAutoLabelDb}
              >
                Auto Label DB
              </button>

              <button
                type="button"
                className="primary-btn"
                onClick={handleCleanupDuplicates}
              >
                Cleanup Duplicates
              </button>

              <button
                type="button"
                className="primary-btn"
                onClick={refreshAll}
              >
                Refresh Data
              </button>
            </div>

            {questions.length > 0 ? (
              <div className="table-wrapper">
                <table className="question-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Question</th>
                      <th>Category</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q) => (
                      <tr key={q.id}>
                        <td>{q.id}</td>
                        <td>{q.question_text}</td>
                        <td>
                          <span className="category-badge">{q.category}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="delete-btn"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-text">No questions found</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default AdminUploads;