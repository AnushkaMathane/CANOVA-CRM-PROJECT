import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/employees/login`,
        {
          email,
          password,
        }
      );

      const employee = res.data.employee;
      const employeeId = employee.id || employee._id;
      const employeeIdCheckin = employee.employeeId;

      const currentDate = new Date().toISOString().split("T")[0];
      const currentTime = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("employee", JSON.stringify(employee));

      const tabKey = `tab-${Date.now()}`;
      localStorage.setItem("tabKey", tabKey);
      localStorage.setItem(tabKey, "open");

      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/attendance/checkin`,
        {
          employeeId: employeeIdCheckin,
          date: currentDate,
          time: currentTime,
        }
      );

      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/employees/status`,
        {
          employeeId: employeeId,
          status: "Active",
        }
      );

      navigate("/home");
    } catch (err) {
      console.error("❌ Login Error:", err);
      if (err.response?.status === 401) {
        setError("Invalid email or last name");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>
            Canova<span className="highlight">CRM</span>
          </h1>
          <p>Welcome Back!</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          {error && <p className="error">{error}</p>}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your last name"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
