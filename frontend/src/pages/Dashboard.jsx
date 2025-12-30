import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Dashboard.module.css";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const location = useLocation();

  const [stats, setStats] = useState([
    { label: "Unassigned Leads", value: 0, icon: "./src/assets/cash.png" },
    { label: "Assigned This Week", value: 0, icon: "./src/assets/person.png" },
    { label: "Active Salespeople", value: 0, icon: "./src/assets/sales.png" },
    {
      label: "Conversion Rate",
      value: "0%",
      icon: "./src/assets/conversion.png",
    },
  ]);

  const [barData, setBarData] = useState({
    labels: [],
    datasets: [],
  });

  const [activityFeed, setActivityFeed] = useState([]);
  const [employees, setEmployees] = useState([]);

  const getPast7Days = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const result = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      result.push({
        label: days[d.getDay()],
        date: d.toISOString().split("T")[0],
        isToday: i === 0,
      });
    }

    return result;
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/dashboard/stats`
        );
        const data = res.data;

        setStats([
          {
            label: "Unassigned Leads",
            value: data.unassignedLeads,
            icon: "./src/assets/cash.png",
          },
          {
            label: "Assigned This Week",
            value: data.assignedThisWeek,
            icon: "./src/assets/person.png",
          },
          {
            label: "Active Salespeople",
            value: data.activeSalespeople,
            icon: "./src/assets/sales.png",
          },
          {
            label: "Conversion Rate",
            value: data.conversionRate,
            icon: "./src/assets/conversion.png",
          },
        ]);

        setEmployees(data.employees || []);
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
      }
    };

    const fetchChartData = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/dashboard/chart`
        );
        const chartValues = res.data;

        const days = getPast7Days();
        const labels = days.map((d) => d.label);
        const barColors = days.map((d) => (d.isToday ? "#4ea8de" : "#ccc"));

        setBarData({
          labels,
          datasets: [
            {
              label: "Conversion %",
              data: chartValues,
              backgroundColor: barColors,
              borderRadius: 4,
              barThickness: 24,
            },
          ],
        });
      } catch (err) {
        console.error("Failed to fetch bar chart data:", err);
      }
    };

    fetchStats();
    fetchChartData();

    const interval = setInterval(() => {
      fetchStats();
      fetchChartData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <h2 className={styles.logo}>
          Canova<span>CRM</span>
        </h2>
        <nav>
          <ul className={styles.navList}>
            <li
              className={
                location.pathname === "/dashboard" ? styles.active : ""
              }
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
              className={
                location.pathname === "/employees" ? styles.active : ""
              }
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
        </nav>
        <p className={styles.profileLabel}>
          <Link to="/profile" className={styles.navLink}>
            Profile
          </Link>
        </p>
      </aside>

      <main className={styles.mainContent}>
        <div className={styles.pageInner}>
          <p className={styles.breadcrumb}>Home &gt; Dashboard</p>

          <div className={styles.statCards}>
            {stats.map((stat, index) => (
              <div key={index} className={styles.statCard}>
                <div className={styles.statLabelWithIcon}>
                  <img src={stat.icon} alt="" className={styles.statIcon} />
                  <span>{stat.label}</span>
                </div>
                <div className={styles.statValue}>{stat.value}</div>
              </div>
            ))}
          </div>

          <div className={styles.analyticsRow}>
            <div className={styles.barChart}>
              <h3>Sales Analytics</h3>
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  layout: { padding: { bottom: 0, top: 10 } },
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) =>
                          ctx.raw === null
                            ? "No Data"
                            : `Conversion: ${ctx.raw}%`,
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      suggestedMax: 60,
                      ticks: { callback: (val) => `${val}%` },
                    },
                  },
                }}
              />
            </div>

            <div className={styles.activityFeed}>
              <h3>Recent Activity Feed</h3>
              <ul>
                {activityFeed.map((activity, i) => (
                  <li key={i}>
                    {activity.text} – <span>{activity.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={styles.employeeTableWrapper}>
            <table className={styles.employeeTable}>
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Employee ID</th>
                  <th>Assigned Leads</th>
                  <th>Closed Leads</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, i) => (
                  <tr key={i}>
                    <td>
                      <input type="checkbox" />
                    </td>
                    <td>
                      <div className={styles.employeeName}>
                        <div className={styles.avatar}>{emp.initials}</div>
                        <div>
                          <div className={styles.name}>{emp.name}</div>
                          <div className={styles.email}>{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{emp.employeeId}</td>
                    <td>{emp.assigned}</td>
                    <td>{emp.closed}</td>
                    <td>
                      <span
                        className={
                          emp.status === "Active"
                            ? styles.activeBadge
                            : styles.inactiveBadge
                        }
                      >
                        ● {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
