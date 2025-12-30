import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Employees.module.css";
import { IoCloseOutline, IoSearchOutline } from "react-icons/io5";

export default function Employees() {
  const location = useLocation();
  const [employees, setEmployees] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [newEmployee, setNewEmployee] = useState({
    firstName: "",
    lastName: "",
    email: "",
    location: "",
    language: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showMenuId, setShowMenuId] = useState(null);
  const employeesPerPage = 8;

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/employees/stats`)
      .then((res) => res.json())
      .then((data) => {
        const enhanced = data.map((emp) => ({
          ...emp,
          employeeId:
            emp.employeeId ||
            `#${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
          assignedLeads: emp.assignedLeads ?? 0,
          closedLeads: emp.closedLeads ?? 0,
          status: emp.status ?? "Inactive",
          avatar: emp.avatar || null,
        }));
        setEmployees(enhanced);
      })
      .catch((err) => {
        console.error("❌ Error fetching employees:", err);
        alert("Failed to load employees.");
      });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const { firstName, lastName, email, location, language } = newEmployee;
    if (!firstName || !lastName || !email || !location || !language)
      return alert("Please fill in all fields.");

    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/employees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEmployee),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Server Error");
        }
        return res.json();
      })
      .then((data) => {
        alert("Employee added successfully!");
        setEmployees((prev) => [...prev, data]);
        setShowModal(false);
        setNewEmployee({
          firstName: "",
          lastName: "",
          email: "",
          location: "",
          language: "",
        });
      })
      .catch((err) => {
        console.error("💥 Error saving employee:", err);
        alert("Failed to save employee. Please check the console.");
      });
  };

  const handleEditClick = (employee) => {
    setSelectedEmployee(employee);
    setEditModal(true);
    setShowMenuId(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setSelectedEmployee((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSave = () => {
    fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/employees/${
        selectedEmployee._id
      }`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedEmployee),
      }
    )
      .then((res) => res.json())
      .then((updated) => {
        setEmployees((prev) =>
          prev.map((emp) => (emp._id === updated._id ? updated : emp))
        );
        setEditModal(false);
        setSelectedEmployee(null);
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?"))
      return;

    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/employees/${id}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to delete");
        setEmployees((prev) => prev.filter((emp) => emp._id !== id));
        setShowMenuId(null);
      })
      .catch((err) => {
        console.error("❌ Delete error:", err);
        alert("Failed to delete employee.");
      });
  };

  const filteredEmployees = employees.filter((emp) =>
    `${emp.firstName} ${emp.lastName} ${emp.email} ${emp.employeeId}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const indexOfLast = currentPage * employeesPerPage;
  const indexOfFirst = indexOfLast - employeesPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
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
        <p className={styles.profileLabel}>
          <Link to="/profile" className={styles.navLink}>
            Profile
          </Link>
        </p>
      </aside>

      <main className={styles.mainContent}>
        <div className={styles.headerBar}>
          <div className={styles.searchContainer}>
            <IoSearchOutline className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search here..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.pageHeader}>
          <p className={styles.breadcrumb}>Home &gt; Employees</p>
          <button className={styles.addBtn} onClick={() => setShowModal(true)}>
            Add Employees
          </button>
        </div>

        <table className={styles.employeeTable}>
          <thead>
            <tr>
              <th>
                <input type="checkbox" />
              </th>
              <th>Name</th>
              <th>Employee ID</th>
              <th>Assigned Leads</th>
              <th>Closed Leads</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {currentEmployees.length > 0 ? (
              currentEmployees.map((emp) => (
                <tr key={emp._id}>
                  <td>
                    <input type="checkbox" />
                  </td>
                  <td>
                    <div className={styles.userCell}>
                      {emp.avatar ? (
                        <img
                          src={emp.avatar}
                          className={styles.avatar}
                          alt="avatar"
                        />
                      ) : (
                        <div className={styles.avatar}>
                          {emp.firstName?.[0]}
                          {emp.lastName?.[0]}
                        </div>
                      )}
                      <div>
                        <p className={styles.empName}>
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className={styles.empEmail}>{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>{emp.employeeId}</td>
                  <td>{emp.assignedLeads}</td>
                  <td>{emp.closedLeads}</td>
                  <td>
                    <span
                      className={`${styles.status} ${
                        emp.status === "Active"
                          ? styles.active
                          : styles.inactive
                      }`}
                    >
                      {emp.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.menuWrapper}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => setShowMenuId(emp._id)}
                      >
                        ⋮
                      </button>
                      {showMenuId === emp._id && (
                        <div className={styles.dropdownMenu}>
                          <button onClick={() => handleEditClick(emp)}>
                            Edit
                          </button>
                          <button onClick={() => handleDelete(emp._id)}>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className={styles.noData}>
                  No employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
            >
              &larr; Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => paginate(num)}
                className={
                  currentPage === num
                    ? styles.currentPage
                    : styles.pageNumberBtn
                }
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next &rarr;
            </button>
          </div>
        )}
      </main>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Add New Employee</h3>
              <button
                onClick={() => setShowModal(false)}
                className={styles.closeModalBtn}
              >
                <IoCloseOutline size={22} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <input
                name="firstName"
                placeholder="First name"
                value={newEmployee.firstName}
                onChange={handleInputChange}
              />
              <input
                name="lastName"
                placeholder="Last name"
                value={newEmployee.lastName}
                onChange={handleInputChange}
              />
              <input
                name="email"
                placeholder="Email"
                value={newEmployee.email}
                onChange={handleInputChange}
              />
              <select
                name="location"
                value={newEmployee.location}
                onChange={handleInputChange}
              >
                <option value="">Select Location</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                <option value="Assam">Assam</option>
                <option value="Bihar">Bihar</option>
                <option value="Chhattisgarh">Chhattisgarh</option>
                <option value="Delhi">Delhi</option>
                <option value="Goa">Goa</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Haryana">Haryana</option>
                <option value="Himachal Pradesh">Himachal Pradesh</option>
                <option value="Jharkhand">Jharkhand</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Kerala">Kerala</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Manipur">Manipur</option>
                <option value="Meghalaya">Meghalaya</option>
                <option value="Mizoram">Mizoram</option>
                <option value="Nagaland">Nagaland</option>
                <option value="Odisha">Odisha</option>
                <option value="Punjab">Punjab</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Sikkim">Sikkim</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Telangana">Telangana</option>
                <option value="Tripura">Tripura</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Uttarakhand">Uttarakhand</option>
                <option value="West Bengal">West Bengal</option>
              </select>

              <select
                name="language"
                value={newEmployee.language}
                onChange={handleInputChange}
              >
                <option value="">Select Language</option>
                <option value="Hindi">Hindi</option>
                <option value="English">English</option>
                <option value="Marathi">Marathi</option>
                <option value="Gujarati">Gujarati</option>
                <option value="Tamil">Tamil</option>
                <option value="Telugu">Telugu</option>
                <option value="Kannada">Kannada</option>
                <option value="Malayalam">Malayalam</option>
                <option value="Punjabi">Punjabi</option>
                <option value="Bengali">Bengali</option>
                <option value="Odia">Odia</option>
                <option value="Assamese">Assamese</option>
                <option value="Urdu">Urdu</option>
              </select>
              <button className={styles.saveBtn} onClick={handleSubmit}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {editModal && selectedEmployee && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Edit Employee</h3>
              <button
                onClick={() => setEditModal(false)}
                className={styles.closeModalBtn}
              >
                <IoCloseOutline size={22} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <input
                name="firstName"
                value={selectedEmployee.firstName}
                onChange={handleEditChange}
              />
              <input
                name="lastName"
                value={selectedEmployee.lastName}
                onChange={handleEditChange}
              />
              <input name="email" value={selectedEmployee.email} disabled />
              <input
                name="location"
                value={selectedEmployee.location}
                disabled
              />
              <input
                name="language"
                value={selectedEmployee.language}
                disabled
              />
              <button className={styles.saveBtn} onClick={handleEditSave}>
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
