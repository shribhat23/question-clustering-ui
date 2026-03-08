import React, { useState, useEffect } from "react";

function AdminUploads() {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [questions, setQuestions] = useState([]);

  const [questionText, setQuestionText] = useState("");
  const [category, setCategory] = useState("Manual");

  // -----------------------------
  // Fetch uploaded files
  // -----------------------------
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

  // -----------------------------
  // Fetch all questions
  // -----------------------------
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

  // -----------------------------
  // Upload file
  // -----------------------------
  const handleUpload = async (e) => {
    e.preventDefault();

    const file = e.target.file.files[0];

    if (!file) {
      setMessage("Please choose a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      setMessage(data.message || "File uploaded successfully");

      fetchFiles();
      fetchQuestions();
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Error while uploading file");
    }
  };

  // -----------------------------
  // Add question manually
  // -----------------------------
  const handleAddQuestion = async (e) => {
    e.preventDefault();

    if (!questionText.trim()) {
      setMessage("Question is required");
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
      setMessage(data.message || "Question added successfully");

      setQuestionText("");
      setCategory("Manual");
      fetchQuestions();
    } catch (error) {
      console.error("Add question error:", error);
      setMessage("Error while adding question");
    }
  };

  // -----------------------------
  // Delete question
  // -----------------------------
  const handleDeleteQuestion = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this question?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`http://127.0.0.1:5000/delete-question/${id}`, {
        method: "DELETE"
      });

      const data = await response.json();
      setMessage(data.message || "Question deleted");

      fetchQuestions();
    } catch (error) {
      console.error("Delete error:", error);
      setMessage("Error while deleting question");
    }
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Admin Panel</h1>

      {message && (
        <p style={{ color: "green", fontWeight: "bold" }}>
          {message}
        </p>
      )}

      <hr />

      <h2>1. Upload File</h2>
      <form onSubmit={handleUpload}>
        <input type="file" name="file" required />
        <button type="submit" style={{ marginLeft: "10px" }}>
          Upload
        </button>
      </form>

      <hr />

      <h2>2. Add Question Manually</h2>
      <form onSubmit={handleAddQuestion}>
        <input
          type="text"
          placeholder="Enter question"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          style={{ width: "400px", padding: "8px" }}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ marginLeft: "10px", padding: "8px" }}
        >
          <option value="Manual">Manual</option>
          <option value="Python">Python</option>
          <option value="Object Oriented Programming">Object Oriented Programming</option>
          <option value="Data Mining">Data Mining</option>
          <option value="Natural Language Processing">Natural Language Processing</option>
          <option value="Computer Vision">Computer Vision</option>
          <option value="Big Data">Big Data</option>
        </select>

        <button type="submit" style={{ marginLeft: "10px" }}>
          Add Question
        </button>
      </form>

      <hr />

      <h2>3. Uploaded Files</h2>
      {files.length > 0 ? (
        <ul>
          {files.map((file, index) => (
            <li key={index}>{file}</li>
          ))}
        </ul>
      ) : (
        <p>No uploaded files found</p>
      )}

      <hr />

      <h2>4. All Questions</h2>
      {questions.length > 0 ? (
        <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", width: "100%" }}>
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
                <td>{q.category}</td>
                <td>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    style={{
                      backgroundColor: "red",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      cursor: "pointer"
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No questions found</p>
      )}
    </div>
  );
}

export default AdminUploads;