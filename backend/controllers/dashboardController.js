const Employee = require("../models/Employee");
const LeadEntry = require("../models/LeadEntry");

exports.getDashboardStats = async (req, res) => {
  try {
    const totalLeads = await LeadEntry.countDocuments();
    const unassignedLeads = await LeadEntry.countDocuments({
      status: "unassigned",
    });

    const assignedLeads = await LeadEntry.countDocuments({
      status: "assigned",
    });
    const closedLeads = await LeadEntry.countDocuments({ status: "closed" });
    const conversionRate =
      assignedLeads === 0
        ? "0%"
        : `${Math.round((closedLeads / assignedLeads) * 100)}%`;

    const allEmployees = await Employee.find().lean();

    const leadSummary = await LeadEntry.aggregate([
      {
        $group: {
          _id: "$assignedTo",

          assigned: { $sum: 1 },

          closed: {
            $sum: {
              $cond: [{ $eq: ["$status", "closed"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const leadMap = {};
    leadSummary.forEach((entry) => {
      if (entry._id) {
        leadMap[entry._id.toString()] = entry;
      }
    });

    const employees = allEmployees.map((emp) => {
      const firstName = emp.firstName || "";
      const lastName = emp.lastName || "";
      const fullName =
        firstName || lastName
          ? `${firstName} ${lastName}`.trim()
          : emp.name || "Unknown";

      let initials = "";
      if (firstName || lastName) {
        initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
      } else if (emp.name) {
        const parts = emp.name.split(" ").filter(Boolean);
        initials = (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
        initials = initials.toUpperCase();
      }

      const idKey = emp._id ? emp._id.toString() : null;
      const leadStats =
        idKey && leadMap[idKey] ? leadMap[idKey] : { assigned: 0, closed: 0 };

      return {
        name: fullName,
        email: emp.email || "",
        employeeId: emp.employeeId || "",
        initials:
          initials ||
          (emp.employeeId ? emp.employeeId.slice(0, 2).toUpperCase() : ""),
        assigned: leadStats.assigned || 0,
        closed: leadStats.closed || 0,
        status: emp.status || "Inactive",
      };
    });

    const totalAssignedAcrossEmployees = employees.reduce(
      (sum, e) => sum + (e.assigned || 0),
      0
    );

    const activeSalespeople = employees.filter(
      (emp) => emp.status === "active"
    ).length;

    return res.status(200).json({
      unassignedLeads,
      assignedThisWeek: totalAssignedAcrossEmployees,
      activeSalespeople,
      conversionRate,
      employees,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch dashboard stats." });
  }
};

module.exports = {
  getDashboardStats: exports.getDashboardStats,
};
