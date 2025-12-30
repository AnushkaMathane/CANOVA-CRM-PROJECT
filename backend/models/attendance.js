const mongoose = require("mongoose");

const breakSchema = new mongoose.Schema({
  start: { type: String, required: true },
  end: { type: String, default: null },
});

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    checkIn: {
      type: String,
      default: null,
    },
    checkOut: {
      type: String,
      default: null,
    },

    breaks: {
      type: [breakSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
