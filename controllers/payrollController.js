// controllers/payrollController.js
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const Payroll = require("../models/Payroll");
const { listMonthDates, toYMD } = require("../utils/dateHelpers");
const { countExpectedWorkingDays } = require("../utils/workdayHelpers");
const rules = require("../config/payrollRules");

// Gather stats for one employee for a month, then compute payroll
async function computePayrollForEmployeeMonth(employee, monthStr) {
  const monthDates = listMonthDates(monthStr);
  const ymds = monthDates.map(toYMD);

  // Fetch all attendance rows for the month
  const records = await Attendance.find({
    employee: employee._id,
    date: { $in: ymds }
  });

  // Tally by status and leaves
  let presentDays = 0;
  let halfDays = 0;
  let absences = 0;
  let nonDeductLeaves = 0;
  let deductLeaves = 0;
  let lateWarnings = 0;

  // Fast lookup by date
  const recByDate = new Map(records.map(r => [r.date, r]));

  // Count expected working days in this month
  const expectedWorkingDays = countExpectedWorkingDays(employee, monthDates);

  // Iterate working days only (non-working days are ignored completely)
  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  for (const d of monthDates) {
    const dayName = dayNames[d.getUTCDay()];
    // If not a working day, skip
    const isWorkingDay = countExpectedWorkingDays({ workingDays: employee.workingDays }, [d]) === 1;
    if (!isWorkingDay) continue;

    const ymd = toYMD(d);
    const rec = recByDate.get(ymd);

    if (!rec) {
      // No record = Absent
      absences += 1;
      continue;
    }

    // Late warnings
    lateWarnings += (rec.warnings || 0);

    // Leaves override status if present
    if (rec.leaveType) {
      const nonDed = !!rules.nonDeductibleLeaves[rec.leaveType];
      if (nonDed) nonDeductLeaves += 1;
      else deductLeaves += 1;
      continue;
    }

    // Status
    switch (rec.status) {
      case "P":
        presentDays += 1;
        break;
      case "HD":
        halfDays += 1;
        break;
      case "A":
      default:
        absences += 1;
        break;
    }
  }

  // Money math
  const baseSalary = Number(employee.salary || 0);
  const perDayRate = expectedWorkingDays > 0 ? baseSalary / expectedWorkingDays : 0;

  // Deduction buckets
  const absenceDeduction = absences * rules.absenceFraction * perDayRate;
  const halfDayDeduction = halfDays * rules.halfDayFraction * perDayRate;
  const leaveDeduction = deductLeaves * perDayRate;

  // Late penalty
  const extraLates = Math.max(0, lateWarnings - rules.lateFreeAllowances);
  const lateDeduction = extraLates * rules.latePenaltyPerExtraLateDayFraction * perDayRate;

  const grossEarnings = baseSalary;

  // Initialize deductions object
  const deductions = {
    absence: Math.round(absenceDeduction * 100) / 100,
    halfDay: Math.round(halfDayDeduction * 100) / 100,
    leave: Math.round(leaveDeduction * 100) / 100,
    late: Math.round(lateDeduction * 100) / 100,
    other: 0
  };

  // ✅ Add employee-level deduction (if any)
  if (employee.deductionAmount && employee.deductionAmount > 0) {
    const type = employee.deductionType || "other";
    if (deductions[type] !== undefined) {
      deductions[type] += employee.deductionAmount;
    } else {
      deductions.other += employee.deductionAmount;
    }
  }

  // Total deductions & net pay
  const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0);
  const netPay = Math.max(0, Math.round((grossEarnings - totalDeductions) * 100) / 100);

  return {
    baseSalary,
    expectedWorkingDays,
    presentDays,
    halfDays,
    absences,
    nonDeductLeaves,
    deductLeaves,
    lateWarnings,
    perDayRate: Math.round(perDayRate * 100) / 100,
    grossEarnings,
    deductions,
    netPay
  };
}


exports.generateMonthlyPayroll = async (req, res) => {
  try {
    const { month, employeeId } = req.query; // e.g. month="2025-08"

    if (!month) return res.status(400).json({ message: "month (YYYY-MM) is required" });

    const employees = employeeId
      ? [await Employee.findById(employeeId)]
      : await Employee.find();

    const results = [];

    for (const emp of employees) {
      if (!emp) continue;
      const computed = await computePayrollForEmployeeMonth(emp, month);

      const existing = await Payroll.findOne({ employee: emp._id, month });
      if (existing) {
        // Update existing draft
        existing.baseSalary = computed.baseSalary;
        existing.expectedWorkingDays = computed.expectedWorkingDays;
        existing.presentDays = computed.presentDays;
        existing.halfDays = computed.halfDays;
        existing.absences = computed.absences;
        existing.nonDeductLeaves = computed.nonDeductLeaves;
        existing.deductLeaves = computed.deductLeaves;
        existing.lateWarnings = computed.lateWarnings;
        existing.perDayRate = computed.perDayRate;
        existing.grossEarnings = computed.grossEarnings;
        existing.deductions = computed.deductions;
        existing.netPay = computed.netPay;
        await existing.save();
        results.push(existing);
      } else {
        // Create new draft
        const row = new Payroll({
          employee: emp._id,
          month,
          status: "Pending",
          ...computed
        });
        await row.save();
        results.push(row);
      }
    }

    res.json({ message: "Payroll generated", month, count: results.length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPayrolls = async (req, res) => {
  try {
    const { month, status, employeeId } = req.query;
    const q = {};
    if (month) q.month = month;
    if (status) q.status = status;
    if (employeeId) q.employee = employeeId;

    const rows = await Payroll.find(q).populate("employee", "employeeId name number department role salary deductionType deductionAmount");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPayrollById = async (req, res) => {
  try {
    const row = await Payroll.findById(req.params.id).populate("employee", "employeeId name number department role salary deductionType deductionAmount");
    if (!row) return res.status(404).json({ message: "Payroll not found" });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// HR/Admin can tweak components (notes, add other deductions/allowances, approve)
exports.patchPayroll = async (req, res) => {
  try {
    const { deductions, notes, status, grossEarnings } = req.body;
    const row = await Payroll.findById(req.params.id);
    if (!row) return res.status(404).json({ message: "Payroll not found" });

    if (grossEarnings != null) row.grossEarnings = Number(grossEarnings);
    if (notes != null) row.notes = notes;

    // allow adjusting deductions (partial)
    if (deductions && typeof deductions === "object") {
      row.deductions.absence = deductions.absence ?? row.deductions.absence;
      row.deductions.halfDay = deductions.halfDay ?? row.deductions.halfDay;
      row.deductions.leave = deductions.leave ?? row.deductions.leave;
      row.deductions.late = deductions.late ?? row.deductions.late;
      row.deductions.other = deductions.other ?? row.deductions.other;
    }

    // recompute net
    const totDed = row.deductions.absence + row.deductions.halfDay + row.deductions.leave + row.deductions.late + row.deductions.other;
    row.netPay = Math.max(0, Math.round((row.grossEarnings - totDed) * 100) / 100);

    if (status) row.status = status; // "Pending" | "Approved" | "Paid"

    await row.save();
    res.json({ message: "Payroll updated", payroll: row });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark as Paid (disbursement)
exports.disbursePayroll = async (req, res) => {
  try {
    const { paymentRef } = req.body;
    const row = await Payroll.findById(req.params.id);
    if (!row) return res.status(404).json({ message: "Payroll not found" });

    row.status = "Paid";
    row.paidAt = new Date();
    if (paymentRef) row.paymentRef = paymentRef;

    await row.save();
    res.json({ message: "Payroll disbursed", payroll: row });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
