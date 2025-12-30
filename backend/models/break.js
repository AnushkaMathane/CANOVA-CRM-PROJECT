const mongoose = require("mongoose");

const BreakSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: { type: String, required: true },
    start: { type: String, required: true },
    end: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Break || mongoose.model("Break", BreakSchema);
