import React, { useState, useEffect, useRef } from "react";
import "../styles/AdminUploads.css";

function AdminUploads() {
  const [uploadMessage, setUploadMessage] = useState("");
  const [questionMessage, setQuestionMessage] = useState("");
  const [manageMessage, setManageMessage] = useState("");

  const [files, setFiles] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState("");
  const [category, setCategory] = useState("Manual");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [activeSection, setActiveSection] = useState("overview");

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const clearMessages = () => {
    setUploadMessage("");
    setQuestionMessage("");
    setManageMessage("");
  };

  const changeSection = (section) => {
    clearMessages();
    setActiveSection(section);
  };

  const fetchFiles = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/files");
      const data = await res.json();

      if (data.uploaded_files) {
        setFiles(data.uploaded_files);
      } else {
        setFiles([]);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      setFiles([]);
    }
  };

  const fetchQuestions = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/questions");
      const data = await res.json();

      if (Array.isArray(data)) {
        setQuestions(data);
      } else {
        setQuestions([]);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      setQuestions([]);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchQuestions();
  }, []);

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

    if (selectedFiles.length === 0) {
      setUploadMessage("Please choose file(s) or folder");
      return;
    }

    const formData = new FormData();

    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        setUploadMessage(data.error || "Error while uploading files");
        return;
      }

      setUploadMessage(data.message || "Files uploaded successfully");
      clearSelectedFiles();
      fetchFiles();
      fetchQuestions();
    } catch (error) {
      console.error("Upload error:", error);
      setUploadMessage("Error while uploading files");
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setUploadMessage("");
    setQuestionMessage("");
    setManageMessage("");

    if (!questionText.trim()) {
      setQuestionMessage("Question is required");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/add-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question_text: questionText,
          category: category
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setQuestionMessage(data.error || "Error while adding question");
        return;
      }

      setQuestionMessage(data.message || "Question added successfully");
      setQuestionText("");
      setCategory("Manual");
      fetchQuestions();
    } catch (error) {
      console.error("Add question error:", error);
      setQuestionMessage("Error while adding question");
    }
  };

  const handleDeleteQuestion = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this question?");
    if (!confirmDelete) return;

    setManageMessage("");
    setUploadMessage("");
    setQuestionMessage("");

    try {
      const response = await fetch(`http://127.0.0.1:5000/delete-question/${id}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (!response.ok) {
        setManageMessage(data.error || "Error while deleting question");
        return;
      }

      setManageMessage(data.message || "Question deleted");
      fetchQuestions();
    } catch (error) {
      console.error("Delete error:", error);
      setManageMessage("Error while deleting question");
    }
  };

  const handleDeleteFile = async (filename) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this file?");
    if (!confirmDelete) return;

    setManageMessage("");
    setUploadMessage("");
    setQuestionMessage("");

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/delete-file/${encodeURIComponent(filename)}`,
        {
          method: "DELETE"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setManageMessage(data.message || "Error while deleting file");
        return;
      }

      setManageMessage(data.message || "File deleted successfully");
      fetchFiles();
    } catch (error) {
      console.error("Delete file error:", error);
      setManageMessage("Error while deleting file");
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
          <div className="topbar-badge">Live Dashboard</div>
        </div>

        {activeSection === "uploadQuestion" && uploadMessage && (
          <div className="admin-message">{uploadMessage}</div>
        )}

        {activeSection === "uploadQuestion" && questionMessage && (
          <div className="admin-message">{questionMessage}</div>
        )}

        {(activeSection === "files" || activeSection === "manage") && manageMessage && (
          <div className="admin-message">{manageMessage}</div>
        )}

        {activeSection === "overview" && (
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
              <div className="stat-icon">➕</div>
              <div>
                <h3>{questions.filter((q) => q.category === "Manual").length}</h3>
                <p>Manual Questions</p>
              </div>
            </div>

            <div className="stat-card orange">
              <div className="stat-icon">📚</div>
              <div>
                <h3>{[...new Set(questions.map((q) => q.category))].length}</h3>
                <p>Total Categories</p>
              </div>
            </div>
          </section>
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
                            <span className="selected-file-name">{file.webkitRelativePath || file.name}</span>
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
                  <option value="Manual">Manual</option>
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