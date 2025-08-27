const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    selfie: { type: String, required: true }, // Cloudinary URL
    intime: { type: String, required: true },
    outtime: { type: String },
    date: { type: String, required: true },
    day: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
