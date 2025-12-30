const express = require("express");
const router = express.Router();
const Admin = require("../models/admin");

router.get("/", async (req, res) => {
  try {
    const admin = await Admin.findOne();
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    res.status(200).json(admin);
  } catch (err) {
    console.error("❌ Error fetching admin:", err);
    res.status(500).json({ message: "Failed to fetch admin details" });
  }
});

router.put("/update", async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;

    if (!firstName || !lastName || !email) {
      return res
        .status(400)
        .json({ message: "firstName, lastName and email are required" });
    }

    let admin = await Admin.findOne();

    if (admin) {
      admin.firstName = firstName;
      admin.lastName = lastName;
      admin.email = email;

      await admin.save();
      return res.status(200).json(admin);
    } else {
      admin = new Admin({ firstName, lastName, email });
      await admin.save();
      return res.status(201).json(admin);
    }
  } catch (err) {
    console.error("❌ Error updating admin:", err);

    if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
      return res.status(409).json({ message: "Email already in use" });
    }

    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: "Failed to update admin" });
  }
});

module.exports = router;
