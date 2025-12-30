const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const leadController = require("../controllers/leadController");
const LeadEntry = require("../models/LeadEntry");

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + Date.now() + ext);
  },
});
const upload = multer({ storage });

router.get("/", leadController.getAllLeads);

router.post("/upload", upload.single("file"), leadController.uploadLeads);

router.get("/employee/:id", async (req, res) => {
  try {
    const leads = await LeadEntry.find({ assignedTo: req.params.id });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leads." });
  }
});

router.get("/scheduled", async (req, res) => {
  try {
    const employeeIdOrCode = req.query.employeeId;
    if (!employeeIdOrCode) {
      return res.status(400).json({ error: "Missing employeeId" });
    }

    let employeeObjectId = employeeIdOrCode;
    if (!mongoose.Types.ObjectId.isValid(employeeIdOrCode)) {
      const emp = await Employee.findOne({ employeeId: employeeIdOrCode });
      if (!emp) return res.status(404).json({ error: "Employee not found" });
      employeeObjectId = emp._id;
    }

    const leads = await LeadEntry.find({
      assignedTo: employeeObjectId,
    })
      .populate("assignedTo", "firstName lastName employeeId avatar")
      .sort({ date: 1, createdAt: -1 });

    res.json(leads);
  } catch (err) {
    console.error("Error fetching scheduled leads:", err);
    res.status(500).json({ error: "Failed to fetch scheduled leads." });
  }
});

router.get("/scheduled", async (req, res) => {
  try {
    const employeeId = req.query.employeeId;
    if (!employeeId) {
      return res.status(400).json({ error: "Missing employeeId" });
    }

    const leads = await LeadEntry.find({
      assignedTo: employeeId,
      status: "scheduled",
    });

    res.json(leads);
  } catch (err) {
    console.error("Error fetching scheduled leads:", err);
    res.status(500).json({ error: "Failed to fetch scheduled leads." });
  }
});

router.put("/update/:id", leadController.updateLeadInfo);

module.exports = router;
