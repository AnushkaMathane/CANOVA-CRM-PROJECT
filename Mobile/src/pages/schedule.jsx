import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FaHome,
  FaUser,
  FaCalendarAlt,
  FaUsers,
  FaSearch,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import "./schedule.css";
import filterIcon from "../assets/filter.png";

const DEFAULT_AVATAR = "/default-avatar.png";

const Schedule = () => {
  const [leads, setLeads] = useState([]);
  const [filterOption, setFilterOption] = useState("All");
  const [showOptions, setShowOptions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const location = useLocation();
  const filterContainerRef = useRef(null);

  const employeeRaw =
    typeof window !== "undefined" ? localStorage.getItem("employee") : null;
  const employee = employeeRaw ? JSON.parse(employeeRaw) : null;
  const employeeIdentifier =
    employee?._id || employee?.employeeId || employee?.id || "";

  function extractDateISO(lead) {
    const candidates = [
      lead.date,
      lead.scheduledDate,
      lead.scheduled_date,
      lead.scheduledAt,
    ];
    for (let c of candidates) {
      if (!c) continue;
      try {
        const d = new Date(c);
        if (!isNaN(d.getTime())) {
          return d.toISOString().split("T")[0];
        }
      } catch {}
      if (typeof c === "string" && /^\d{4}-\d{2}-\d{2}$/.test(c)) return c;
    }
    return null;
  }

  function formatDateForDisplay(isoDate) {
    if (!isoDate) return "--/--/----";
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      return isoDate;
    }
  }

  function isAssignedToMe(lead) {
    if (!employeeIdentifier) return false;
    const assigned = lead.assignedTo;
    if (!assigned) return false;
    if (typeof assigned === "string") return assigned === employeeIdentifier;
    if (typeof assigned === "object") {
      return (
        assigned._id === employeeIdentifier ||
        assigned._id === String(employeeIdentifier) ||
        assigned.employeeId === employeeIdentifier ||
        assigned.employeeId === String(employeeIdentifier)
      );
    }
    return false;
  }

  useEffect(() => {
    if (!employeeIdentifier) {
      setLeads([]);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchScheduledLeads = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = `${
          import.meta.env.VITE_API_BASE_URL
        }/api/leads/scheduled?employeeId=${encodeURIComponent(
          employeeIdentifier
        )}`;

        const res = await fetch(url, { signal });
        if (!res.ok) {
          const text = await res.text().catch(() => null);
          throw new Error(text || `Server error ${res.status}`);
        }
        const data = await res.json();
        const filtered = (data || []).filter((lead) => isAssignedToMe(lead));

        const normalized = filtered.map((lead) => {
          const isoDate = extractDateISO(lead);
          return {
            ...lead,
            _dateISO: isoDate,
            _displayDate: formatDateForDisplay(isoDate),
          };
        });

        const todayISO = new Date().toISOString().split("T")[0];
        const finalLeads =
          filterOption === "Today"
            ? normalized.filter((l) => l._dateISO === todayISO)
            : normalized;

        setLeads(finalLeads);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("❌ Error fetching scheduled leads:", err);
          setError(err.message || "Failed to fetch scheduled leads");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchScheduledLeads();

    return () => controller.abort();
  }, [filterOption, employeeIdentifier]);

  useEffect(() => {
    function onDocClick(e) {
      if (
        showOptions &&
        filterContainerRef.current &&
        !filterContainerRef.current.contains(e.target)
      ) {
        setShowOptions(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [showOptions]);

  const visibleLeads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((lead) => {
      const name = (lead.name || "").toLowerCase();
      const phone = (lead.phone || "").toLowerCase();
      const email = (lead.email || "").toLowerCase();
      const assignedName =
        (typeof lead.assignedTo === "object" &&
          (lead.assignedTo.firstName || lead.assignedTo.first_name)) ||
        "";
      return (
        name.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        String(assignedName).toLowerCase().includes(q)
      );
    });
  }, [leads, searchQuery]);

  function handleAvatarError(e) {
    if (e?.target) e.target.src = DEFAULT_AVATAR;
  }

  return (
    <div className="schedule-container">
      <div className="schedule-header">
        <h2>
          Canova<span className="crm-highlight">CRM</span>
        </h2>
        <h3>Schedule</h3>
      </div>

      <div className="search-filter-row">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search by name, phone or email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-container" ref={filterContainerRef}>
          <button
            className="filter-btn"
            onClick={() => setShowOptions((s) => !s)}
            aria-haspopup="true"
            aria-expanded={showOptions}
          >
            <img src={filterIcon} alt="Filter" className="filter-icon" />
          </button>
          {showOptions && (
            <div className="filter-dropdown" role="menu">
              <div
                role="menuitem"
                onClick={() => {
                  setFilterOption("All");
                  setShowOptions(false);
                }}
              >
                All
              </div>
              <div
                role="menuitem"
                onClick={() => {
                  setFilterOption("Today");
                  setShowOptions(false);
                }}
              >
                Today
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="schedule-list">
        {loading ? (
          <p style={{ textAlign: "center", marginTop: 20 }}>Loading…</p>
        ) : error ? (
          <p style={{ textAlign: "center", marginTop: 20, color: "red" }}>
            Error: {error}
          </p>
        ) : visibleLeads.length === 0 ? (
          <p style={{ textAlign: "center", marginTop: 20 }}>
            No scheduled leads found.
          </p>
        ) : (
          visibleLeads.map((lead, idx) => (
            <div
              key={lead._id || idx}
              className={`schedule-card ${idx === 0 ? "highlight" : ""}`}
            >
              <div className="schedule-top">
                <span className="call-type">
                  {lead.type
                    ? lead.type.charAt(0).toUpperCase() + lead.type.slice(1)
                    : "Referral"}
                </span>
                <span className="date">{lead._displayDate}</span>
              </div>

              <div className="mobile">{lead.phone || "--"}</div>

              <div className="call-info" aria-hidden>
                <FaMapMarkerAlt />
                <span>Call</span>
                {lead.scheduledTime || lead.time ? (
                  <small style={{ marginLeft: 8 }}>
                    {lead.scheduledTime || lead.time}
                  </small>
                ) : null}
              </div>

              <div className="user-info">
                <img
                  src={lead.avatar || DEFAULT_AVATAR}
                  alt="avatar"
                  className="avatar"
                  onError={handleAvatarError}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: 600 }}>
                    {lead.name || "Unnamed"}
                  </span>
                  <small style={{ color: "#666" }}>
                    {typeof lead.assignedTo === "object"
                      ? lead.assignedTo.firstName || lead.assignedTo._id
                      : lead.assignedTo || ""}
                  </small>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="navbar" role="navigation" aria-label="Main navigation">
        <Link
          to="/home"
          className={`nav-item ${
            location.pathname === "/home" ? "active" : ""
          }`}
        >
          <FaHome />
          <span>Home</span>
        </Link>
        <Link
          to="/mobleads"
          className={`nav-item ${
            location.pathname === "/mobleads" ? "active" : ""
          }`}
        >
          <FaUsers />
          <span>Leads</span>
        </Link>
        <Link
          to="/schedule"
          className={`nav-item ${
            location.pathname === "/schedule" ? "active" : ""
          }`}
        >
          <FaCalendarAlt />
          <span>Schedule</span>
        </Link>
        <Link
          to="/profile"
          className={`nav-item ${
            location.pathname === "/profile" ? "active" : ""
          }`}
        >
          <FaUser />
          <span>Profile</span>
        </Link>
      </div>
    </div>
  );
};

export default Schedule;
