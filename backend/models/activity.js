const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  lead: { type: mongoose.Schema.Types.ObjectId, ref: "LeadEntry" },
  type: {
    type: String,
    enum: [
      "assigned",
      "typeChanged",
      "statusChanged",
      "scheduled",
      "leadUpdated",
    ],
    required: true,
  },
  details: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports =
  mongoose.models.Activity || mongoose.model("Activity", activitySchema);
