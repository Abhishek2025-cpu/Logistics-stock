// models/payroll.js
const mongoose = require("mongoose");

const deductionSchema = new mongoose.Schema({
  absence: { type: Number, default: 0 },       // amount deducted for Absent days
  halfDay: { type: Number, default: 0 },       // amount deducted for HD
  leave:   { type: Number, default: 0 },       // amount deducted for deductible leaves
  late:    { type: Number, default: 0 },       // late penalty
  other:   { type: Number, default: 0 }
}, { _id: false });

const payrollSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  month: { type: String, required: true }, // "YYYY-MM"
  baseSalary: { type: Number, required: true },    // monthly salary from employee
  expectedWorkingDays: { type: Number, required: true },
  presentDays: { type: Number, default: 0 },
  halfDays: { type: Number, default: 0 },
  absences: { type: Number, default: 0 },
  nonDeductLeaves: { type: Number, default: 0 },
  deductLeaves: { type: Number, default: 0 },
  lateWarnings: { type: Number, default: 0 },

  perDayRate: { type: Number, required: true },
  grossEarnings: { type: Number, required: true }, // usually baseSalary
  deductions: { type: deductionSchema, default: () => ({}) },
  netPay: { type: Number, required: true },

  status: { type: String, enum: ["Pending", "Approved", "Paid"], default: "Pending" },
  notes: { type: String },

  paidAt: { type: Date },
  paymentRef: { type: String } // UTR/Txn id if any
}, { timestamps: true });

payrollSchema.index({ employee: 1, month: 1 }, { unique: true }); // one row per emp-month

module.exports = mongoose.model("Payroll", payrollSchema);
