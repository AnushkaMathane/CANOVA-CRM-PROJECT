const fs = require("fs");
const csv = require("csv-parser");
const LeadEntry = require("../models/LeadEntry");
const Employee = require("../models/Employee");
const Activity = require("../models/activity");

exports.getAllLeads = async (req, res) => {
  try {
    const leads = await LeadEntry.find()
      .populate("assignedTo", "firstName lastName email employeeId")
      .sort({ createdAt: -1 });

    res.status(200).json(leads);
  } catch (err) {
    console.error("❌ Fetch Error:", err);
    res.status(500).json({ message: "Error fetching leads" });
  }
};

exports.uploadLeads = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded." });

  const leads = [];
  const phoneKeys = ["phone", "phone_no", "contact", "contact_no"];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (row) => {
      const phoneValue =
        phoneKeys.map((k) => row[k]?.trim()).find(Boolean) || "";
      const lead = {
        name: row.name?.trim() || null,
        email: row.email?.trim() || "",
        phone: phoneValue,
        date: row.date?.trim() || "",
        language: row.language?.trim() || "",
        location: row.location?.trim() || "",
        type: row.type?.trim() || "warm",
        status: "unassigned",
        uploadedBy: "admin",
      };
      if (lead.name) leads.push(lead);
    })
    .on("end", async () => {
      try {
        const inserted = await LeadEntry.insertMany(leads);
        await distributeLeads();
        res
          .status(200)
          .json({
            message: "Leads uploaded and distributed.",
            leads: inserted,
          });
        console.log("Leads Distrubuted");
      } catch (err) {
        console.error("❌ Insert Error:", err);
        res
          .status(500)
          .json({ message: "Error saving leads", error: err.message });
      }
    });
};

const distributeLeads = async () => {
  const employees = await Employee.find();
  const unassignedLeads = await LeadEntry.find({ assignedTo: null });

  for (const lead of unassignedLeads) {
    const fullMatch = employees.find(
      (emp) =>
        emp.language.toLowerCase() === lead.language?.toLowerCase() &&
        emp.location.toLowerCase() === lead.location?.toLowerCase()
    );

    if (fullMatch) {
      lead.assignedTo = fullMatch._id;
      lead.status = "assigned";
      await lead.save();
      await Activity.create({
        employee: fullMatch._id,
        lead: lead._id,
        type: "assigned",
        details: "Lead assigned based on full match",
      });
      continue;
    }

    const partialMatch = employees.find(
      (emp) =>
        emp.language.toLowerCase() === lead.language?.toLowerCase() ||
        emp.location.toLowerCase() === lead.location?.toLowerCase()
    );

    if (partialMatch) {
      lead.assignedTo = partialMatch._id;
      lead.status = "assigned";
      await lead.save();
      await Activity.create({
        employee: partialMatch._id,
        lead: lead._id,
        type: "assigned",
        details: "Lead assigned based on partial match",
      });
      continue;
    }

    const grouped = employees.map((emp) => ({ id: emp._id, count: 0 }));
    const counts = await LeadEntry.aggregate([
      { $match: { assignedTo: { $ne: null } } },
      { $group: { _id: "$assignedTo", count: { $sum: 1 } } },
    ]);

    counts.forEach((c) => {
      const emp = grouped.find((g) => g.id.toString() === c._id.toString());
      if (emp) emp.count = c.count;
    });

    grouped.sort((a, b) => a.count - b.count);
    if (grouped[0]) {
      lead.assignedTo = grouped[0].id;
      lead.status = "assigned";
      await lead.save();
      await Activity.create({
        employee: grouped[0].id,
        lead: lead._id,
        type: "assigned",
        details: "Lead assigned via equal distribution",
      });
    }
  }
};

exports.updateLeadType = async (req, res) => {
  const { type, employeeId } = req.body;
  try {
    const lead = await LeadEntry.findByIdAndUpdate(
      req.params.id,
      { type },
      { new: true }
    );
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    await Activity.create({
      employee: employeeId,
      lead: lead._id,
      type: "typeChanged",
      details: `Changed type to ${type}`,
    });

    res.status(200).json(lead);
  } catch (err) {
    console.error("❌ Type Update Error:", err);
    res.status(500).json({ message: "Failed to update lead type" });
  }
};

exports.updateLeadStatus = async (req, res) => {
  const { status, employeeId } = req.body;
  try {
    const lead = await LeadEntry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    await Activity.create({
      employee: employeeId,
      lead: lead._id,
      type: "statusChanged",
      details: `Changed status to ${status}`,
    });

    res.status(200).json(lead);
  } catch (err) {
    console.error("❌ Status Update Error:", err);
    res.status(500).json({ message: "Failed to update lead status" });
  }
};

exports.scheduleLead = async (req, res) => {
  const { date, time, employeeId } = req.body;
  try {
    const lead = await LeadEntry.findByIdAndUpdate(
      req.params.id,
      { date, time },
      { new: true }
    );
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    await Activity.create({
      employee: employeeId,
      lead: lead._id,
      type: "scheduled",
      details: `Scheduled call on ${date} at ${time}`,
    });

    res.status(200).json(lead);
  } catch (err) {
    console.error("❌ Schedule Error:", err);
    res.status(500).json({ message: "Failed to schedule lead" });
  }
};

exports.getScheduledLeads = async (req, res) => {
  try {
    const employeeId = req.query.employeeId || req.params.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: "Missing employeeId" });
    }

    const leads = await LeadEntry.find({
      assignedTo: employeeId,
      $or: [
        { status: "Ongoing", date: { $exists: true, $ne: "" } },
        { type: "hot" },
      ],
    }).sort({ date: 1 });

    res.status(200).json(leads);
  } catch (err) {
    console.error("❌ Error fetching scheduled leads:", err);
    res.status(500).json({ message: "Failed to fetch scheduled leads" });
  }
};

exports.updateLeadInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, status, date, time, employeeId } = req.body;

    const updateFields = {};
    if (type) updateFields.type = type;
    if (status) updateFields.status = status;
    if (date) updateFields.date = date;
    if (time) updateFields.time = time;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No valid fields to update." });
    }

    const updatedLead = await LeadEntry.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    if (!updatedLead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    await Activity.create({
      employee: employeeId,
      lead: updatedLead._id,
      type: "leadUpdated",
      details: `Updated fields: ${Object.keys(updateFields).join(", ")}`,
    });

    res.status(200).json(updatedLead);
  } catch (err) {
    console.error("❌ Error updating lead:", err);
    res.status(500).json({ message: "Failed to update lead" });
  }
};
