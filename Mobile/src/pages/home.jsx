import React, { useEffect, useState } from "react";
import "./home.css";
import { FaHome, FaUser, FaCalendarAlt, FaUsers } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";

const Home = () => {
  const [onBreak, setOnBreak] = useState(false);
  const [greeting, setGreeting] = useState("Good Morning");
  const [employee, setEmployee] = useState(null);
  const [checkIn, setCheckIn] = useState("--:--");
  const [checkOut, setCheckOut] = useState("--:--");
  const [breakHistory, setBreakHistory] = useState([]);
  const [activities, setActivities] = useState([]);

  const location = useLocation();
  const currentPath = location.pathname;

  const currentDate = new Date().toISOString().split("T")[0];
  const currentTime = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  useEffect(() => {
    const emp = JSON.parse(localStorage.getItem("employee"));
    if (emp) {
      setEmployee(emp);
      getGreetingTime();
      const empId = emp.employeeId || emp._id;
      fetchBreaks(empId);
      fetchAttendance(empId);
      checkActiveBreak(empId);
      fetchActivities(empId);
    }
  }, []);

  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  };

  const fetchAttendance = async (employeeId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/attendance/today`, {
        params: { employeeId, date: currentDate },
      });
      if (res.data) {
        setCheckIn(res.data.checkIn || "--:--");
        setCheckOut(res.data.checkOut || "--:--");
      }
    } catch (err) {
      console.error("❌ Failed to fetch attendance:", err);
    }
  };

  const fetchBreaks = async (employeeId) => {
    try {
      console.log("Employee Id is  " + employeeId);
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/attendance/breaks`, {
        params: { employeeId },
      });

      const allBreaks = res.data || [];

      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);

      const filtered = allBreaks.filter((brk) => {
        const created = new Date(brk.createdAt);
        return created >= sevenDaysAgo;
      });

      setBreakHistory(filtered.length ? filtered : allBreaks);
    } catch (err) {
      console.error("❌ Failed to fetch breaks:", err);
    }
  };

  const checkActiveBreak = async (employeeId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/attendance/breaks`, {
        params: { employeeId },
      });

      const ongoing = res.data.find(
        (brk) => brk.date === currentDate && !brk.end
      );

      setOnBreak(!!ongoing);
    } catch (err) {
      console.error("❌ Failed to check active break:", err);
    }
  };

  const handleToggleBreak = async () => {
    const newStatus = !onBreak;
    setOnBreak(newStatus);

    const empId = employee.employeeId || employee._id;
    const emp_id = employee._id;
    console.log("Toggled" + empId);

    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/attendance/toggle-break`, {
        employeeId: empId,
        date: currentDate,
        isStarting: newStatus,
      });

      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/employees/status`, {
        employeeId: emp_id,
        status: newStatus ? "Inactive" : "Active",
      });

      fetchBreaks(empId);
    } catch (err) {
      console.error("❌ Break toggle failed:", err);
    }
  };

  const fetchActivities = async (employeeId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/activity/${employeeId}`);
      setActivities(res.data || []);
    } catch (err) {
      console.error("❌ Failed to fetch activities:", err);
    }
  };

  const formatActivity = (activity) => {
    const leadName = activity.lead?.name || "a lead";
    switch (activity.type) {
      case "assigned":
        return `You were assigned ${leadName}`;
      case "typeChanged":
        return `Converted ${leadName}'s type – ${activity.details}`;
      case "statusChanged":
        return `Closed ${leadName} – ${activity.details}`;
      case "scheduled":
        return `Scheduled ${leadName} – ${activity.details}`;
      case "leadUpdated":
        return `Updated ${leadName} – ${activity.details}`;
      default:
        return `Activity on ${leadName}`;
    }
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB");
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>
          Canova<span className="crm-highlight">CRM</span>
        </h1>
        <p>{greeting}</p>
        <h2>{employee?.firstName + " " + employee?.lastName}</h2>
      </div>

      <div className="home-content">
        <div className="section">
          <h3>Timings</h3>
          <div className="timing-box">
            <div className="check-row">
              <span>Check in</span>
              <span>Check Out</span>
            </div>
            <div className="check-row">
              <span>{checkIn}</span>
              <span>{checkOut}</span>
            </div>
          </div>

          <div className="break-box">
            <div className="break-header">
              <span>Break</span>
              <span>{onBreak ? currentTime : "--:--"}</span>
              <label className="switch">
                <input type="checkbox" checked={onBreak} onChange={handleToggleBreak} />
                <span className="slider"></span>
              </label>
            </div>

            <div className="break-table-header">
              <span>Break</span>
              <span>Ended</span>
              <span>Date</span>
            </div>

            {breakHistory.length === 0 ? (
              <div className="break-record"><span colSpan={3}>No records</span></div>
            ) : (
              breakHistory.map((brk, i) => (
                <div className="break-record" key={i}>
                  <span>{brk.start || "--:--"}</span>
                  <span>{brk.end || "--:--"}</span>
                  <span>{formatDate(brk.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="section">
          <h3>Recent Activity</h3>
          <div className="activity-box">
            {activities.length === 0 ? (
              <p>No recent activity</p>
            ) : (
              <ul>
                {activities.map((act, i) => (
                  <li key={i}>
                    {formatActivity(act)} –{" "}
                    {new Date(act.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="navbar fixed-navbar">
        <Link to="/home" className={`nav-item ${currentPath === "/home" ? "active" : ""}`}>
          <FaHome />
          <span>Home</span>
        </Link>
        <Link to="/mobleads" className={`nav-item ${currentPath === "/mobleads" ? "active" : ""}`}>
          <FaUsers />
          <span>Leads</span>
        </Link>
        <Link to="/schedule" className={`nav-item ${currentPath === "/schedule" ? "active" : ""}`}>
          <FaCalendarAlt />
          <span>Schedule</span>
        </Link>
        <Link to="/profile" className={`nav-item ${currentPath === "/profile" ? "active" : ""}`}>
          <FaUser />
          <span>Profile</span>
        </Link>
      </div>
    </div>
  );
};

export default Home;
