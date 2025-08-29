const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  date: { type: String, required: true }, // e.g. "2025-08-29"
  punchIn: { type: Date },
  punchInSelfie: { type: String },
  punchOut: { type: Date },
  punchOutSelfie: { type: String },
  status: { type: String, enum: ["P", "A", "HD"], default: "A" },
  warnings: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
