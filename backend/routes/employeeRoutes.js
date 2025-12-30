const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");
const Counter = require("../models/counter");
const employeeController = require("../controllers/employeeController");

router.get("/", async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.status(200).json(employees);
  } catch (err) {
    console.error("❌ Error fetching employees:", err);
    res.status(500).json({ message: "Failed to fetch employees." });
  }
});

router.get("/stats", employeeController.getEmployeeStats);

router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, location, language } = req.body;
    if (!firstName || !lastName || !email || !location || !language) {
      return res.status(400).json({ message: "All fields are required." });
    }

    let counter = await Counter.findOne({ name: "employeeId" });
    if (!counter) {
      counter = new Counter({ name: "employeeId", value: 1000 });
    }

    counter.value += 1;
    await counter.save();

    const newEmployee = new Employee({
      firstName,
      lastName,
      email,
      location,
      language,
      employeeId: `CON${counter.value}`,
    });

    const saved = await newEmployee.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("❌ Error saving employee:", err);
    res.status(500).json({ message: "Failed to save employee" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting employee:", err);
    res.status(500).json({ message: "Failed to delete employee" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updated = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json(updated);
  } catch (err) {
    console.error("❌ Error updating employee:", err);
    res.status(500).json({ message: "Failed to update employee" });
  }
});

router.post("/login", employeeController.loginEmployee);

router.post("/logout", employeeController.logoutEmployee);

router.post("/status", employeeController.updateEmployeeStatus);

router.put("/inactive/:id", employeeController.setInactive);

module.exports = router;
