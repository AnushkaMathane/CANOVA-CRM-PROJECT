import React, { useState, useEffect } from "react";
import {
  FaHome,
  FaUser,
  FaCalendarAlt,
  FaUsers,
  FaSearch,
  FaEdit,
  FaClock,
  FaCheckCircle,
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import "./mobleads.css";
import filterIcon from "../assets/filter.png";

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [dropdownIdx, setDropdownIdx] = useState(null);
  const [showClockIdx, setShowClockIdx] = useState(null);
  const [statusIdx, setStatusIdx] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filterValue, setFilterValue] = useState("All");
  const [scheduleData, setScheduleData] = useState({});
  const [selectedTypes, setSelectedTypes] = useState({});

  const location = useLocation();

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    const employee = JSON.parse(localStorage.getItem("employee"));
    if (!employee) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/leads/employee/${employee._id}`);
      const data = await res.json();
      setLeads(data);

      const scheduleDefaults = {};
      data.forEach((lead) => {
        scheduleDefaults[lead._id] = {
          date: lead.scheduledDate || lead.date?.split("T")[0],
          time: lead.scheduledTime || "14:00",
        };
      });
      setScheduleData(scheduleDefaults);
    } catch (err) {
      console.error("❌ Error fetching leads:", err);
    }
  };

  const updateLead = async (id, updates) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/leads/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error("Failed to update");

      const updated = await res.json();

      setLeads((prevLeads) =>
        prevLeads.map((lead) => (lead._id === id ? { ...lead, ...updates } : lead))
      );
    } catch (err) {
      console.error("❌ Update error:", err);
    }
  };

  const handleStatusChange = (index, status) => {
    const lead = leads[index];
    updateLead(lead._id, { status });
    setStatusIdx(null);
  };

  const handleScheduleSave = (leadId) => {
    const { date, time } = scheduleData[leadId] || {};
    updateLead(leadId, {
      scheduledDate: date,
      scheduledTime: time,
    });
    setShowClockIdx(null);
  };

  const handleScheduleChange = (leadId, field, value) => {
    setScheduleData((prev) => ({
      ...prev,
      [leadId]: {
        ...prev[leadId],
        [field]: value,
      },
    }));
  };


  const sortedLeads = [...leads].sort((a, b) => {
    if (a.status === "Closed" && b.status !== "Closed") return 1;
    if (a.status !== "Closed" && b.status === "Closed") return -1;
    return 0;
  });

  return (
    <div className="leads-container">
      <div className="leads-header">
        <h2>
          Canova<span className="crm-highlight">CRM</span>
        </h2>
        <h3>Leads</h3>
      </div>

      <div className="search-filter-row">
        <div className="search-box">
          <FaSearch />
          <input type="text" placeholder="Search" />
        </div>
        <img
          src={filterIcon}
          alt="Filter"
          className="filter-icon"
          onClick={() => setShowFilter(!showFilter)}
        />
        {showFilter && (
          <div className="filter-dropdown">
            <label>
              <input
                type="radio"
                name="filter"
                value="All"
                checked={filterValue === "All"}
                onChange={(e) => setFilterValue(e.target.value)}
              />
              All
            </label>
            <label>
              <input
                type="radio"
                name="filter"
                value="Today"
                checked={filterValue === "Today"}
                onChange={(e) => setFilterValue(e.target.value)}
              />
              Today
            </label>
            <button className="save-btn" onClick={() => setShowFilter(false)}>
              Save
            </button>
          </div>
        )}
      </div>

      <div className="leads-list">
        {sortedLeads.map((lead, idx) => (
          <div
            className={`lead-card ${lead.status === "Closed" ? "closed" : ""}`}
            key={idx}
            style={{ position: "relative" }}
          >
            <div className="lead-info">
              <div className="lead-title">
                <div className={`status-bar ${lead.type?.toLowerCase() || "warm"}`}></div>
                <div>
                  <h4>{lead.name}</h4>
                  <p>@{lead.email}</p>
                </div>
                <div className={`status-circle ${lead.type?.toLowerCase() || "warm"}`}>
                  {lead.status === "assigned" ? "Ongoing" : lead.status}
                </div>
              </div>

              <div className="lead-date">
                <FaCalendarAlt />
                <span>
                  {new Date(lead.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "2-digit",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            <div className="lead-actions">
              <button
                className="btn edit"
                onClick={() => {
                  setDropdownIdx(idx === dropdownIdx ? null : idx);
                  setShowClockIdx(null);
                  setStatusIdx(null);
                }}
              >
                <FaEdit />
              </button>
              <button
                className="btn calendar"
                onClick={() => {
                  setShowClockIdx(idx === showClockIdx ? null : idx);
                  setDropdownIdx(null);
                  setStatusIdx(null);
                }}
              >
                <FaClock />
              </button>
              <button
                className="btn check"
                onClick={() => {
                  setStatusIdx(idx === statusIdx ? null : idx);
                  setDropdownIdx(null);
                  setShowClockIdx(null);
                }}
              >
                <FaCheckCircle />
              </button>
            </div>

            {dropdownIdx === idx && (
              <div className="lead-options small">
                <button
                  className={`hot ${selectedTypes[lead._id] === "Hot" ? "selected" : ""}`}
                  onClick={() =>
                    setSelectedTypes((prev) => ({ ...prev, [lead._id]: "Hot" }))
                  }
                >
                  Hot
                </button>
                <button
                  className={`warm ${selectedTypes[lead._id] === "Warm" ? "selected" : ""}`}
                  onClick={() =>
                    setSelectedTypes((prev) => ({ ...prev, [lead._id]: "Warm" }))
                  }
                >
                  Warm
                </button>
                <button
                  className={`cold ${selectedTypes[lead._id] === "Cold" ? "selected" : ""}`}
                  onClick={() =>
                    setSelectedTypes((prev) => ({ ...prev, [lead._id]: "Cold" }))
                  }
                >
                  Cold
                </button>
                <button
                  className="save-btn"
                  onClick={() => {
                    const selectedType = selectedTypes[lead._id];
                    if (selectedType) {
                      updateLead(lead._id, { type: selectedType });
                      setDropdownIdx(null);
                    }
                  }}
                >
                  Save
                </button>
              </div>
            )}

            {showClockIdx === idx && (
              <div className="schedule-options small">
                <input
                  type="date"
                  value={scheduleData[lead._id]?.date || ""}
                  onChange={(e) =>
                    handleScheduleChange(lead._id, "date", e.target.value)
                  }
                />
                <input
                  type="time"
                  value={scheduleData[lead._id]?.time || ""}
                  onChange={(e) =>
                    handleScheduleChange(lead._id, "time", e.target.value)
                  }
                />
                <button className="save-btn" onClick={() => handleScheduleSave(lead._id)}>
                  Save
                </button>
              </div>
            )}

            {statusIdx === idx && (
              <div className="status-options small">
                <button
                  disabled={lead.status === "Closed"}
                  onClick={() => handleStatusChange(idx, "Ongoing")}
                >
                  Ongoing
                </button>
                <button onClick={() => handleStatusChange(idx, "Closed")}>Closed</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="navbar">
        <Link to="/home" className={`nav-item ${location.pathname === "/home" ? "active" : ""}`}>
          <FaHome />
          <span>Home</span>
        </Link>
        <Link to="/mobleads" className={`nav-item ${location.pathname === "/mobleads" ? "active" : ""}`}>
          <FaUsers />
          <span>Leads</span>
        </Link>
        <Link to="/schedule" className={`nav-item ${location.pathname === "/schedule" ? "active" : ""}`}>
          <FaCalendarAlt />
          <span>Schedule</span>
        </Link>
        <Link to="/profile" className={`nav-item ${location.pathname === "/profile" ? "active" : ""}`}>
          <FaUser />
          <span>Profile</span>
        </Link>
      </div>
    </div>
  );
};

export default Leads;
