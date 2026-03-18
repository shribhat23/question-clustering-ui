import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Clustering from "./pages/Clustering";
import About from "./pages/About";

import AdminUpload from "./Admin_Frontend/AdminUploads";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clustering" element={<Clustering />} />
        <Route path="/about" element={<About />} /> 

        {/* Admin Upload Page */}
        <Route path="/admin/upload" element={<AdminUpload />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;