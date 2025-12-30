import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Settings.module.css";

export default function Settings() {
  const location = useLocation();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API_BASE = "https://canova-crm-project.onrender.com";

  useEffect(() => {
    async function fetchAdmin() {
      try {
        const res = await fetch(`${API_BASE}/api/admin`);
        if (!res.ok) return;
        const data = await res.json();
        setFormData(prev => ({
          ...prev,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email
        }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAdmin();
  }, [API_BASE]);

  const handleChange = e => {
    setError("");
    setSuccess("");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email
        })
      });

      if (!res.ok) throw new Error("Update failed");
      setSuccess("Profile updated successfully");
      setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
    } catch (err) {
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <h2 className={styles.logo}>
          Canova<span>CRM</span>
        </h2>
        <ul className={styles.menu}>
          {["Dashboard", "Leads", "Employees", "Settings"].map(item => (
            <li
              key={item}
              className={location.pathname.includes(item.toLowerCase()) ? styles.active : ""}
            >
              <Link to={`/${item.toLowerCase()}`}>{item}</Link>
            </li>
          ))}
        </ul>
      </aside>

      <main className={styles.content}>
        <div className={styles.breadcrumb}>Home &gt; Settings</div>

        <div className={styles.card}>
          <h3>Edit Profile</h3>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className={styles.error}>{error}</div>}
              {success && <div className={styles.success}>{success}</div>}

              <div className={styles.field}>
                <label>First name</label>
                <input name="firstName" value={formData.firstName} onChange={handleChange} />
              </div>

              <div className={styles.field}>
                <label>Last name</label>
                <input name="lastName" value={formData.lastName} onChange={handleChange} />
              </div>

              <div className={styles.field}>
                <label>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} />
              </div>

              <div className={styles.field}>
                <label>Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} />
              </div>

              <div className={styles.field}>
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.actions}>
                <button disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
