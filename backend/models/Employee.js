const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    location: { type: String, required: true },
    language: { type: String, required: true },
    employeeId: { type: String, unique: true, required: true },
    assignedLeads: { type: Number, default: 0 },
    closedLeads: { type: Number, default: 0 },
    status: { type: String, default: "Active" },
    avatar: { type: String, default: "" },

    password: { type: String, required: false, default: "password" },
  },
  { timestamps: true }
);

const Employee =
  mongoose.models.Employee || mongoose.model("Employee", employeeSchema);

module.exports = Employee;
