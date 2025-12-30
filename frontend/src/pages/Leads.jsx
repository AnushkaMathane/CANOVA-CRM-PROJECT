import React, { useState, useRef, useEffect } from "react";
import styles from "./Leads.module.css";
import { FiSearch } from "react-icons/fi";
import { IoCloseOutline } from "react-icons/io5";
import { MdOutlineFileUpload } from "react-icons/md";
import { Link, useLocation } from "react-router-dom";

export default function Leads() {
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercentage, setUploadPercentage] = useState(0);
  const [leadData, setLeadData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const fileInputRef = useRef(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

  const fetchLeadEntries = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/leads`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setLeadData(data);
        else setLeadData([]);
      } else {
        console.error("Failed to fetch leads:", res.statusText);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
  };

  useEffect(() => {
    fetchLeadEntries();
  }, []);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortableValue = (item, key) => {
    if (!key) return "";
    if (key === "assignedTo")
      return item.assignedTo
        ? `${item.assignedTo.firstName || ""} ${
            item.assignedTo.lastName || ""
          }`.trim()
        : "";
    if (key === "date") return item.date ? Date.parse(item.date) : 0;
    const val = item[key];
    return typeof val === "string" ? val.toLowerCase() : val ?? "";
  };

  const sortedLeads = [...leadData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = getSortableValue(a, sortConfig.key);
    const bVal = getSortableValue(b, sortConfig.key);
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const filteredLeads = sortedLeads.filter((lead) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const assignedName = lead.assignedTo
      ? `${lead.assignedTo.firstName || ""} ${lead.assignedTo.lastName || ""}`
      : "";
    return (
      (lead.name || "").toString().toLowerCase().includes(q) ||
      (lead.email || "").toString().toLowerCase().includes(q) ||
      (lead.phone || "").toString().toLowerCase().includes(q) ||
      (lead.status || "").toString().toLowerCase().includes(q) ||
      (lead.type || "").toString().toLowerCase().includes(q) ||
      (lead.source || "").toString().toLowerCase().includes(q) ||
      assignedName.toLowerCase().includes(q)
    );
  });

  const handleAddLeadsClick = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFile(null);
    setIsUploading(false);
    setUploadPercentage(0);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith(".csv")) {
      setFile(selectedFile);
    } else {
      alert("Please select a valid .csv file");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".csv")) setFile(droppedFile);
    else alert("Please upload a CSV file.");
  };
  const handleBrowseClick = () =>
    fileInputRef.current && fileInputRef.current.click();

  const handleUpload = async () => {
    if (!file) return alert("Please select a file to upload.");
    setIsUploading(true);
    setUploadPercentage(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE}/api/leads/upload`, true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadPercentage(percent);
        }
      };

      xhr.onload = () => {
        setIsUploading(false);
        if (xhr.status === 200 || xhr.status === 201) {
          fetchLeadEntries();
          setIsModalOpen(false);
          setFile(null);
          setShowConfirmation(true);
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            alert(error.message || "Error uploading CSV.");
          } catch (e) {
            alert("Error uploading CSV.");
          }
        }
      };

      xhr.onerror = () => {
        setIsUploading(false);
        alert("Something went wrong during upload.");
      };

      xhr.send(formData);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Something went wrong during upload.");
      setIsUploading(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "N/A";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString();
    } catch (e) {
      return iso;
    }
  };

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <h2 className={styles.logo}>
          Canova<span className={styles.crmColor}>CRM</span>
        </h2>
        <ul className={styles.navList}>
          <li
            className={location.pathname === "/dashboard" ? styles.active : ""}
          >
            <Link to="/dashboard" className={styles.navLink}>
              Dashboard
            </Link>
          </li>
          <li className={location.pathname === "/leads" ? styles.active : ""}>
            <Link to="/leads" className={styles.navLink}>
              Leads
            </Link>
          </li>
          <li
            className={location.pathname === "/employees" ? styles.active : ""}
          >
            <Link to="/employees" className={styles.navLink}>
              Employees
            </Link>
          </li>
          <li
            className={location.pathname === "/settings" ? styles.active : ""}
          >
            <Link to="/settings" className={styles.navLink}>
              Settings
            </Link>
          </li>
        </ul>
        <div className={styles.profileLabel}>Profile</div>
      </aside>

      <main className={styles.mainContent}>
        <div className={styles.pageInner}>
          <div className={styles.contentInner}>
            <div className={styles.headerBar}>
              <div className={styles.searchContainer}>
                <FiSearch />
                <input
                  className={styles.searchInput}
                  type="text"
                  placeholder="Search here..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className={`${styles.actions} ${styles.pushRight}`}>
                <button
                  className={styles.addLeadsBtn}
                  onClick={handleAddLeadsClick}
                >
                  Add Leads
                </button>
              </div>
            </div>
          </div>

          <p className={styles.breadcrumb}>Home &gt; Leads</p>

          <div className={styles.tableWrapper}>
            <div className={styles.tableHeaderRow}>
              <div style={{ width: 36, fontWeight: 700 }}>No.</div>

              <div
                style={{ minWidth: 180, cursor: "pointer" }}
                onClick={() => handleSort("name")}
                title="Sort by name"
              >
                Name{" "}
                {sortConfig.key === "name"
                  ? sortConfig.direction === "asc"
                    ? "↑"
                    : "↓"
                  : ""}
              </div>

              <div style={{ minWidth: 220 }}>Email</div>
              <div style={{ minWidth: 100 }}>Source</div>

              <div
                style={{ minWidth: 95, cursor: "pointer" }}
                onClick={() => handleSort("date")}
                title="Sort by date"
              >
                Date{" "}
                {sortConfig.key === "date"
                  ? sortConfig.direction === "asc"
                    ? "↑"
                    : "↓"
                  : ""}
              </div>

              <div style={{ minWidth: 110 }}>Location</div>
              <div style={{ minWidth: 80 }}>Language</div>

              <div
                style={{ minWidth: 160, cursor: "pointer" }}
                onClick={() => handleSort("assignedTo")}
                title="Sort by assigned"
              >
                Assigned To{" "}
                {sortConfig.key === "assignedTo"
                  ? sortConfig.direction === "asc"
                    ? "↑"
                    : "↓"
                  : ""}
              </div>

              <div style={{ minWidth: 95 }}>Status</div>
              <div style={{ minWidth: 85 }}>Type</div>
            </div>

            <div className={styles.leadsList}>
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead, index) => {
                  const assignedName = lead.assignedTo
                    ? `${lead.assignedTo.firstName || ""} ${
                        lead.assignedTo.lastName || ""
                      }`.trim()
                    : "Unassigned";
                  return (
                    <div className={styles.leadCard} key={lead._id || index}>
                      <div className={styles.leadIndex}>{index + 1}</div>

                      <div className={`${styles.leadCol} ${styles.colName}`}>
                        {lead.name || "N/A"}
                      </div>

                      <div className={`${styles.leadCol} ${styles.colEmail}`}>
                        {lead.email || "-"}
                      </div>

                      <div className={`${styles.leadCol} ${styles.colSource}`}>
                        {lead.source || lead.sourceType || "-"}
                      </div>

                      <div className={`${styles.leadCol} ${styles.colDate}`}>
                        {formatDate(lead.date)}
                      </div>

                      <div
                        className={`${styles.leadCol} ${styles.colLocation}`}
                      >
                        {lead.location || "-"}
                      </div>

                      <div
                        className={`${styles.leadCol} ${styles.colLanguage}`}
                      >
                        {lead.language || "-"}
                      </div>

                      <div
                        className={`${styles.leadCol} ${styles.colAssigned}`}
                      >
                        {assignedName}
                      </div>

                      <div className={`${styles.leadCol} ${styles.colStatus}`}>
                        <span className={styles.statusPill}>
                          {lead.status || "-"}
                        </span>
                      </div>

                      <div className={`${styles.leadCol} ${styles.colType}`}>
                        {lead.type || "-"}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={styles.noResults}>No leads found.</div>
              )}
            </div>

            <div className={styles.pagination}>
              <button className={styles.pageBtn}>← Previous</button>
              <button className={`${styles.pageBtn} ${styles.active}`}>
                1
              </button>
              <button className={styles.pageBtn}>2</button>
              <button className={styles.pageBtn}>Next →</button>
            </div>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Upload CSV</h3>
              <button
                onClick={handleCloseModal}
                className={styles.modalCloseBtn}
              >
                <IoCloseOutline size={22} />
              </button>
            </div>

            <div
              className={styles.dropZone}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {!isUploading ? (
                <div className={styles.dropArea}>
                  <MdOutlineFileUpload size={48} />
                  <p className={styles.dragText}>Drag & drop your CSV here</p>
                  <p className={styles.orText}>OR</p>
                  <button
                    className={styles.browseFilesBtn}
                    onClick={handleBrowseClick}
                  >
                    Browse files
                  </button>
                  <input
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                  {file && (
                    <p className={styles.selectedFile}>
                      {file.name} - {(file.size / 1024).toFixed(2)} KB
                    </p>
                  )}
                </div>
              ) : (
                <div className={styles.uploadingStateCircle}>
                  <div className={styles.loaderWrapper}>
                    <div className={styles.loaderCircle}></div>
                    <div className={styles.percentageOverlay}>
                      {uploadPercentage}%
                    </div>
                  </div>
                  <p className={styles.verifyingText}>Uploading...</p>
                </div>
              )}
            </div>

            {!isUploading && (
              <div className={styles.modalActions}>
                <button
                  onClick={handleCloseModal}
                  className={styles.modalCancelBtn}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  className={styles.modalNextBtn}
                  disabled={!file}
                >
                  Upload
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showConfirmation && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.confirmationModal}`}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Upload Successful</h3>
              <button
                onClick={() => setShowConfirmation(false)}
                className={styles.modalCloseBtn}
              >
                <IoCloseOutline size={22} />
              </button>
            </div>
            <p className={styles.modalDescription}>
              CSV uploaded and leads have been refreshed.
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.modalNextBtn}
                onClick={() => setShowConfirmation(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
