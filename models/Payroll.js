const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    month: { type: String, required: true }, // e.g. "2025-08"
    baseSalary: { type: Number, required: true }, // fixed monthly salary
    workingDays: { type: Number, default: 0 }, // total working days in the month
    presentDays: { type: Number, default: 0 },
    absentDays: { type: Number, default: 0 },
    halfDays: { type: Number, default: 0 },
    overTimeHours: { type: Number, default: 0 },

    leaveDeduction: { type: Number, default: 0 }, // Salary deduction for leave
    overtimePay: { type: Number, default: 0 }, // Extra pay for overtime
    finalSalary: { type: Number, default: 0 }, // Net salary to be paid

    calculatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // HR/Admin
    calculatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payroll", payrollSchema);
