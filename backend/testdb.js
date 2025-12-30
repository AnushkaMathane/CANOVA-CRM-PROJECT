require('dotenv').config();
const mongoose = require('mongoose');
const LeadEntry = require('./models/LeadEntry');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB Atlas");

    const result = await LeadEntry.create({
      name: "Test Lead",
      email: "test@example.com",
      phone: "1234567890",
      language: "English",
      location: "Mumbai",
      date: "2025-06-29",
      uploadedBy: "admin",
    });

    console.log("🎯 Test lead inserted:", result);
    process.exit();
  })
  .catch((err) => {
    console.error("❌ MongoDB connection or insert error:", err);
    process.exit(1);
  });
