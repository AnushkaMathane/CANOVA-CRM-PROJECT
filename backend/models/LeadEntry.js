const mongoose = require("mongoose");

const leadEntrySchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    date: Date,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    status: {
      type: String,
      enum: ["assigned", "Ongoing", "closed", "unassigned"],
      default: "unassigned",
    },
    type: {
      type: String,
      enum: ["Hot", "Warm", "Cold"],
      default: "Warm",
    },
    scheduledDate: String,
    scheduledTime: String,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.LeadEntry || mongoose.model("LeadEntry", leadEntrySchema);
