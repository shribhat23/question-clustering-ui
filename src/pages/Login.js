import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();

    const users = JSON.parse(localStorage.getItem("users")) || [];

    const validUser = users.find(
      (user) => user.email === email && user.password === password
    );

    if (!validUser) {
      alert("Invalid Email or Password ❌");
      return;
    }

    localStorage.setItem("currentUser", JSON.stringify(validUser));

    alert("Login Successful ✅");

    if (validUser.email === "admin@gmail.com") {
      navigate("/admin/upload");
    } else {
      navigate("/home");
    }
  };

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-card">
          <h2>Login</h2>

          <form onSubmit={handleLogin}>
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

            <button className="btn" type="submit">
              Login
            </button>
          </form>

          <p className="signup">
            Don't have account?
            <Link to="/signup"> Signup</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;