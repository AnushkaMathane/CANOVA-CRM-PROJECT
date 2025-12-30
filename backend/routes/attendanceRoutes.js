const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");

router.get("/today", attendanceController.getTodayAttendance);
router.post("/checkin", attendanceController.checkIn);
router.post("/checkout", attendanceController.checkOut);
router.post("/toggle-break", attendanceController.toggleBreak);
router.get("/breaks", attendanceController.getBreaks);

module.exports = router;
