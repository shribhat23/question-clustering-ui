import React from "react";

function Clustering() {

  const fileName = localStorage.getItem("uploadedFile");

  return (
    <div style={{ padding: "40px" }}>
      <h2>Clustering Result</h2>

      <p><strong>Uploaded File:</strong> {fileName}</p>

      <div style={{
        marginTop: "20px",
        background: "#f4f6f9",
        padding: "20px",
        borderRadius: "8px"
      }}>
        <h3>Cluster Output</h3>
        <p>Cluster 1 → Data Science Questions</p>
        <p>Cluster 2 → Web Development Questions</p>
        <p>Cluster 3 → AI & ML Questions</p>
        <p>Cluster 4 → Cloud Computing Questions</p>
      </div>
    </div>
  );
}

export default Clustering;