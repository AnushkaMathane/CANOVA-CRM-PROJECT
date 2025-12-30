const Employee = require("../models/Employee");
const LeadEntry = require("../models/LeadEntry");

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.status(200).json(employees);
  } catch (err) {
    console.error("❌ Error fetching employees:", err);
    res.status(500).json({ message: "Failed to fetch employees." });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });
    res.status(200).json(employee);
  } catch (err) {
    console.error("❌ Error fetching employee:", err);
    res.status(500).json({ message: "Failed to fetch employee." });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const payload = req.body;

    const created = await Employee.create(payload);
    res.status(201).json(created);
  } catch (err) {
    console.error("❌ Error creating employee:", err);

    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "Duplicate field value", error: err.keyValue });
    }
    res.status(500).json({ message: "Failed to create employee." });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    delete updates._id;

    const updated = await Employee.findByIdAndUpdate(id, updates, {
      new: true,
    });
    if (!updated)
      return res.status(404).json({ message: "Employee not found" });

    res.status(200).json(updated);
  } catch (err) {
    console.error("❌ Error updating employee:", err);
    res.status(500).json({ message: "Failed to update employee." });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Employee.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ message: "Employee not found" });
    res.status(200).json({ message: "Employee deleted" });
  } catch (err) {
    console.error("❌ Error deleting employee:", err);
    res.status(500).json({ message: "Failed to delete employee." });
  }
};

exports.getEmployeeStats = async (req, res) => {
  try {
    const employees = await Employee.find().lean();

    const leadStats = await LeadEntry.aggregate([
      { $match: { assignedTo: { $ne: null } } },
      {
        $group: {
          _id: "$assignedTo",
          assigned: { $sum: 1 },
          closed: {
            $sum: {
              $cond: [{ $eq: [{ $toLower: "$status" }, "closed"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const statsMap = {};
    leadStats.forEach((stat) => {
      if (stat._id) {
        statsMap[stat._id.toString()] = {
          assigned: stat.assigned || 0,
          closed: stat.closed || 0,
        };
      }
    });

    const enriched = employees.map((emp) => {
      const s = statsMap[emp._id.toString()] || { assigned: 0, closed: 0 };
      return {
        ...emp,
        assignedLeads: s.assigned,
        closedLeads: s.closed,
      };
    });

    res.status(200).json(enriched);
  } catch (err) {
    console.error("❌ Error fetching employee stats:", err);
    res.status(500).json({ message: "Failed to fetch employee statistics." });
  }
};

exports.loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;
    const employee = await Employee.findOne({ email });
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    employee.status = "Active";
    await employee.save();

    res.status(200).json({ message: "Logged in", employee });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

exports.logoutEmployee = async (req, res) => {
  try {
    const { email } = req.body;
    const employee = await Employee.findOneAndUpdate(
      { email },
      { status: "Inactive" },
      { new: true }
    );
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });
    res.status(200).json({ message: "Logged out", employee });
  } catch (err) {
    console.error("❌ Logout error:", err);
    res.status(500).json({ message: "Logout failed" });
  }
};

exports.updateEmployeeStatus = async (req, res) => {
  try {
    const { employeeId, status } = req.body;
    if (!employeeId)
      return res.status(400).json({ message: "Missing employeeId" });

    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { status },
      { new: true }
    );
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    res.status(200).json({ message: "Status updated", employee });
  } catch (err) {
    console.error("❌ Status update error:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
};

exports.setInactive = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByIdAndUpdate(
      id,
      { status: "Inactive" },
      { new: true }
    );
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });
    res.status(200).json({ message: "Status set to Inactive", employee });
  } catch (err) {
    console.error("❌ Set Inactive Error:", err);
    res.status(500).json({ message: "Failed to set status" });
  }
};
