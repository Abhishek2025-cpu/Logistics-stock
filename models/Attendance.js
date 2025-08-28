const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    selfie: { type: String }, // Made optional as leaves won't have a selfie
    intime: { type: String }, // Made optional for leave records
    outtime: { type: String }, // Made optional for leave records
    date: { type: String, required: true }, // Date of the attendance/leave
    day: { type: String, required: true },

    // New fields for Leave Management
    isLeave: { type: Boolean, default: false }, // True if this record represents a leave
    leaveType: { type: String }, // e.g., 'sick', 'casual', 'earned', 'unpaid'
    leaveStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }, // Status of the leave request
    leaveReason: { type: String }, // Employee's reason for the leave
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin/HR who reviewed it
    reviewedAt: { type: Date }, // Timestamp of review
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);