import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./profile.css";
import { FaHome, FaUser, FaCalendarAlt, FaUsers } from "react-icons/fa";

const API_BASE = "https://canova-crm-project.onrender.com/api/employees";

const Profile = () => {
  const [formData, setFormData] = useState({
    employeeId: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  useEffect(() => {
    const init = async () => {
      const stored = JSON.parse(localStorage.getItem("employee"));
      const token = localStorage.getItem("token");

      if (stored) {
        setFormData((prev) => ({
          ...prev,
          employeeId: stored.employeeId || "",
          firstName: stored.firstName || "",
          lastName: stored.lastName || "",
          email: stored.email || "",
        }));
      }

      const empId = (stored && (stored.employeeId || "")) || "";
      if (!empId) return;

      setLoading(true);
      try {
        const url = `${API_BASE}?id=${encodeURIComponent(empId)}`;
        const res = await fetch(url, {
          method: "GET",
          headers: token
            ? {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              }
            : { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          console.warn("GET employee failed:", res.status);
          setLoading(false);
          return;
        }
        const body = await res.json();
        let employee = null;
        if (Array.isArray(body)) employee = body[0];
        else if (body && body.employee) employee = body.employee;
        else if (body && body.data)
          employee = Array.isArray(body.data) ? body.data[0] : body.data;
        else employee = body;

        if (employee) {
          localStorage.setItem("employee", JSON.stringify(employee));
          setFormData((prev) => ({
            ...prev,
            employeeId: employee.employeeId || prev.employeeId,
            firstName: employee.firstName || prev.firstName,
            lastName: employee.lastName || prev.lastName,
            email: employee.email || prev.email,
          }));
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const token = localStorage.getItem("token");
    const stored = JSON.parse(localStorage.getItem("employee")) || {};

    const mongoId = stored._id || stored.id || null;
    const empId = formData.employeeId || stored.employeeId || "";

    if (!mongoId && !empId) {
      alert("Missing employee identifier. Please login again.");
      return;
    }

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
    };
    if (formData.password) payload.password = formData.password;

    setLoading(true);
    try {
      const url = mongoId
        ? `${API_BASE}/${mongoId}`
        : `${API_BASE}?id=${encodeURIComponent(empId)}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: token
          ? {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            }
          : { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        const errMsg =
          (body && (body.message || body.error)) ||
          `Update failed (${res.status})`;
        alert(errMsg);
        console.error("Update failed:", body || res.statusText);
        setLoading(false);
        return;
      }

      let updated = null;
      if (!body) updated = { ...payload, employeeId: empId, _id: mongoId };
      else if (Array.isArray(body)) updated = body[0];
      else if (body.employee) updated = body.employee;
      else if (body.data)
        updated = Array.isArray(body.data) ? body.data[0] : body.data;
      else updated = body;

      if (!updated.employeeId) updated.employeeId = empId;
      if (!updated._id && mongoId) updated._id = mongoId;

      localStorage.setItem("employee", JSON.stringify(updated));
      setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
      alert("Profile updated successfully.");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Server error while updating. See console.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("employee");
    navigate("/");
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>
          Canova<span className="crm-highlight">CRM</span>
        </h2>
        <h3>Profile</h3>
      </div>

      <form className="profile-form" onSubmit={handleSave}>
        <input type="hidden" name="employeeId" value={formData.employeeId} />

        <label>First name</label>
        <input
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          placeholder="First name"
        />

        <label>Last name</label>
        <input
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          placeholder="Last name"
        />

        <label>Email</label>
        <input
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          type="email"
        />

        <label>New password (optional)</label>
        <input
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="New password"
          type="password"
        />

        <label>Confirm new password</label>
        <input
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm password"
          type="password"
        />

        <button type="submit" className="save-btn" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          className="logout-btn"
          onClick={handleLogout}
          disabled={loading}
        >
          Logout
        </button>
      </form>

      <div className="navbar">
        <NavLink
          to="/home"
          icon={<FaHome />}
          label="Home"
          active={currentPath === "/home"}
        />
        <NavLink
          to="/mobleads"
          icon={<FaUsers />}
          label="Leads"
          active={currentPath === "/mobleads"}
        />
        <NavLink
          to="/schedule"
          icon={<FaCalendarAlt />}
          label="Schedule"
          active={currentPath === "/schedule"}
        />
        <NavLink
          to="/profile"
          icon={<FaUser />}
          label="Profile"
          active={currentPath === "/profile"}
        />
      </div>
    </div>
  );
};

const NavLink = ({ to, icon, label, active }) => (
  <div
    className={`nav-item ${active ? "active" : ""}`}
    onClick={() => (window.location.href = to)}
  >
    {icon}
    <span>{label}</span>
  </div>
);

export default Profile;
