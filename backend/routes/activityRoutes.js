const express = require("express");
const router = express.Router();
const Activity = require("../models/activity");

router.get("/:employeeId", async (req, res) => {
  try {
    const activities = await Activity.find({ employee: req.params.employeeId })
      .populate("lead", "name")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json(activities);
  } catch (err) {
    console.error("❌ Error fetching activity:", err);
    res.status(500).json({ message: "Failed to fetch activity." });
  }
});

module.exports = router;
