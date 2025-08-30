// models/LeaveRequest.js
const mongoose = require("mongoose");

const leaveRequestSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  leaveType: { type: String, enum: ["CL", "SL", "PL", "UL","HL"], required: true }, // Casual, Sick, Paid, Unpaid
  fromDate: { type: String, required: true }, // YYYY-MM-DD
  toDate: { type: String, required: true },
  reason: { type: String },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  appliedAt: { type: Date, default: Date.now },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" }, // HR/Admin who approved/rejected
}, { timestamps: true });

module.exports = mongoose.model("LeaveRequest", leaveRequestSchema);
