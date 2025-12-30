const mongoose = require("mongoose");
const Attendance = require("../models/attendance");
const Break = require("../models/break");
const Employee = require("../models/Employee"); 


function nowHHMM() {
  return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
function todayYYYYMMDD() {
  return new Date().toISOString().split("T")[0];
}

async function resolveEmployeeObjectId(identifier) {
  if (!identifier) throw new Error("employee identifier required");

  
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    return mongoose.Types.ObjectId(identifier);
  }

  const emp = await Employee.findOne({ employeeId: identifier });
  if (!emp) {
    const err = new Error(`Employee not found for identifier: ${identifier}`);
    err.code = "EMP_NOT_FOUND";
    throw err;
  }
  return emp._id;
}


async function checkIn(req, res) {
  try {
    const { employeeId: incomingEmployeeId, date, time } = req.body;
    if (!incomingEmployeeId) return res.status(400).json({ message: "employeeId required" });

    const resolvedId = await resolveEmployeeObjectId(incomingEmployeeId);

    const d = date || todayYYYYMMDD();
    const t = time || nowHHMM();

    let attendance = await Attendance.findOne({ employeeId: resolvedId, date: d });
    if (!attendance) {
      attendance = new Attendance({ employeeId: resolvedId, date: d, checkIn: t });
    } else {
      attendance.checkIn = t;
    }

    await attendance.save();
    res.status(200).json(attendance);
  } catch (err) {
    console.error("❌ Check-in error:", err.message || err);
    if (err.code === "EMP_NOT_FOUND") return res.status(404).json({ message: err.message });
    res.status(500).json({ message: "Check-in failed" });
  }
}


async function checkOut(req, res) {
  try {
    const { employeeId: incomingEmployeeId, date, time } = req.body;
    if (!incomingEmployeeId) return res.status(400).json({ message: "employeeId required" });

    const resolvedId = await resolveEmployeeObjectId(incomingEmployeeId);

    const d = date || todayYYYYMMDD();
    const t = time || nowHHMM();

    const attendance = await Attendance.findOne({ employeeId: resolvedId, date: d });
    if (!attendance) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    attendance.checkOut = t;
    await attendance.save();
    res.status(200).json(attendance);
  } catch (err) {
    console.error("❌ Check-out error:", err.message || err);
    if (err.code === "EMP_NOT_FOUND") return res.status(404).json({ message: err.message });
    res.status(500).json({ message: "Check-out failed" });
  }
}

async function getTodayAttendance(req, res) {
  try {
    const { employeeId: incomingEmployeeId, date } = req.query;
    if (!incomingEmployeeId) return res.status(400).json({ message: "employeeId required" });

    const resolvedId = await resolveEmployeeObjectId(incomingEmployeeId);

    const d = date || todayYYYYMMDD();
    const attendance = await Attendance.findOne({ employeeId: resolvedId, date: d });
    if (!attendance) return res.status(404).json({ message: "No attendance found" });

    res.status(200).json(attendance);
  } catch (err) {
    console.error("❌ Error getting attendance:", err.message || err);
    if (err.code === "EMP_NOT_FOUND") return res.status(404).json({ message: err.message });
    res.status(500).json({ message: "Failed to fetch attendance" });
  }
}


async function toggleBreak(req, res) {
  try {
    const { employeeId: incomingEmployeeId, date: reqDate, isStarting } = req.body;
    if (!incomingEmployeeId) return res.status(400).json({ message: "employeeId is required" });

    const resolvedId = await resolveEmployeeObjectId(incomingEmployeeId);
    const date = reqDate || todayYYYYMMDD();

 
    const attendance = await Attendance.findOne({ employeeId: resolvedId, date });
    if (!attendance) return res.status(400).json({ message: "Check-in required first" });

    
    const activeBreak = await Break.findOne({ employeeId: resolvedId, date, end: null }).sort({ createdAt: -1 });

    
    if (typeof isStarting === "boolean") {
      if (isStarting) {
        if (activeBreak) return res.status(400).json({ message: "Break already active", status: "already_active", break: activeBreak });
        const b = new Break({ employeeId: resolvedId, date, start: nowHHMM() });
        await b.save();
        return res.status(200).json({ message: "Break started", status: "break_started", break: b });
      } else {
        if (!activeBreak) return res.status(404).json({ message: "No active break found", status: "no_active_break" });
        activeBreak.end = nowHHMM();
        await activeBreak.save();
        return res.status(200).json({ message: "Break ended", status: "break_ended", break: activeBreak });
      }
    }

    
    if (!activeBreak) {
      const b = new Break({ employeeId: resolvedId, date, start: nowHHMM() });
      await b.save();
      return res.status(200).json({ message: "Break started", status: "break_started", break: b });
    } else {
      activeBreak.end = nowHHMM();
      await activeBreak.save();
      return res.status(200).json({ message: "Break ended", status: "break_ended", break: activeBreak });
    }
  } catch (err) {
    console.error("❌ Toggle break error:", err.message || err);
    if (err.code === "EMP_NOT_FOUND") return res.status(404).json({ message: err.message });
    res.status(500).json({ message: "Failed to toggle break" });
  }
}


async function getBreaks(req, res) {
  try {
    const { employeeId: incomingEmployeeId, date } = req.query;
    if (!incomingEmployeeId) return res.status(400).json({ message: "employeeId required" });

    const resolvedId = await resolveEmployeeObjectId(incomingEmployeeId);

    const q = { employeeId: resolvedId };
    if (date) q.date = date;

    const breaks = await Break.find(q).sort({ createdAt: -1 });
    res.status(200).json(breaks);
  } catch (err) {
    console.error("❌ Break fetch error:", err.message || err);
    if (err.code === "EMP_NOT_FOUND") return res.status(404).json({ message: err.message });
    res.status(500).json({ message: "Failed to fetch breaks" });
  }
}

module.exports = {
  checkIn,
  checkOut,
  getTodayAttendance,
  toggleBreak,
  getBreaks,
};
