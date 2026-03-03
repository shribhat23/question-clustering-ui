import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./App.css";

function Signup() {
  const navigate = useNavigate(); // ✅ added

  const [role, setRole] = useState("Student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = (e) => {
    e.preventDefault();

    const hasNumber = /[0-9]/;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;
    const hasUppercase = /[A-Z]/;

    if (password.length < 8) {
      alert("Password must be at least 8 characters long");
      return;
    }

    if (!hasUppercase.test(password)) {
      alert("Password must contain at least one uppercase letter");
      return;
    }

    if (!hasNumber.test(password)) {
      alert("Password must contain at least one number");
      return;
    }

    if (!hasSpecialChar.test(password)) {
      alert("Password must contain at least one special character");
      return;
    }

    // ✅ signup success
    alert(`Signup successful as ${role}`);
    navigate("/"); // 🔥 redirect to Login page
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Sign Up</h2>

        <form onSubmit={handleSignup}>
          <select
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option>Student</option>
            <option>Teacher</option>
          </select>

          <input
            type="text"
            className="input"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            className="input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              className="input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <span
              className="eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              <i
                className={
                  showPassword
                    ? "fa-solid fa-eye-slash"
                    : "fa-solid fa-eye"
                }
              ></i>
            </span>
          </div>

          <button type="submit" className="btn">
            Create Account
          </button>
        </form>

        <p className="signup">
          Already have an account? <Link to="/">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
