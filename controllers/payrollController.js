const moment = require("moment-timezone");
const Attendance = require("../models/Attendance");
const Payroll = require("../models/Payroll");


// 🔒 Verify Admin/HR
const verifyAdminHRToken = (req) => {
  const decoded = verifyToken(req);
  const role = decoded.role?.toLowerCase();
  if (role !== "admin" && role !== "hr") {
    throw new Error("Unauthorized: Only Admin or HR can calculate payroll");
  }
  return decoded;
};


const verifyToken = (req) => {
  const token = req.headers["authorization"];
  if (!token) throw new Error("Authorization token required");
  return jwt.verify(token, process.env.JWT_SECRET);
};


// 📌 Generate Payroll for a User for a Given Month
exports.generatePayroll = async (req, res) => {
  try {
    const decoded = verifyAdminHRToken(req);

    const { userId, month, baseSalary } = req.body;
    if (!userId || !month || !baseSalary) {
      return res
        .status(400)
        .json({ status: 400, message: "userId, month, and baseSalary are required" });
    }

    // Find all attendance records of the month
    const startDate = moment(month + "-01").startOf("month").format("YYYY-MM-DD");
    const endDate = moment(month + "-01").endOf("month").format("YYYY-MM-DD");

    const records = await Attendance.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate },
    });

    let presentDays = 0,
      absentDays = 0,
      halfDays = 0,
      overTimeHours = 0;

    records.forEach((rec) => {
      if (rec.isLeave) {
        // Approved leave = not counted as present
        if (rec.leaveStatus === "approved") {
          absentDays += 1;
        }
      } else {
        if (rec.intime && rec.outtime) {
          // Half-day logic (e.g., < 4 hrs)
          const inTimeMoment = moment(rec.intime, "HH:mm");
          const outTimeMoment = moment(rec.outtime, "HH:mm");
          const hoursWorked = outTimeMoment.diff(inTimeMoment, "hours");

          if (hoursWorked < 4) {
            halfDays += 1;
          } else {
            presentDays += 1;
          }

          // Overtime (e.g., > 9 hrs)
          if (hoursWorked > 9) {
            overTimeHours += hoursWorked - 9;
          }
        } else {
          absentDays += 1;
        }
      }
    });

    const workingDays = presentDays + absentDays + halfDays;

    // Salary Calculations
    const perDaySalary = baseSalary / workingDays;
    const halfDayDeduction = (perDaySalary / 2) * halfDays;
    const fullDayDeduction = perDaySalary * absentDays;

    const leaveDeduction = halfDayDeduction + fullDayDeduction;
    const overtimePay = overTimeHours * (perDaySalary / 8); // per hour overtime rate
    const finalSalary = baseSalary - leaveDeduction + overtimePay;

    const payroll = await Payroll.create({
      user: userId,
      month,
      baseSalary,
      workingDays,
      presentDays,
      absentDays,
      halfDays,
      overTimeHours,
      leaveDeduction,
      overtimePay,
      finalSalary,
      calculatedBy: decoded.id,
    });

    return res.status(201).json({
      status: 201,
      message: "Payroll generated successfully",
      payroll,
    });
  } catch (error) {
    console.error("GeneratePayroll Error:", error);
    return res.status(500).json({ status: 500, message: error.message });
  }
};

// 📌 Get Payroll of a User (Admin/HR only)
exports.getPayrollByUser = async (req, res) => {
  try {
    verifyAdminHRToken(req);

    const { userId } = req.params;
    const payrolls = await Payroll.find({ user: userId }).sort({ month: -1 });

    if (!payrolls || payrolls.length === 0) {
      return res
        .status(404)
        .json({ status: 404, message: "No payroll records found" });
    }

    return res.status(200).json({
      status: 200,
      message: "Payroll fetched successfully",
      payrolls,
    });
  } catch (error) {
    console.error("GetPayrollByUser Error:", error);
    return res.status(500).json({ status: 500, message: error.message });
  }
};

// 📌 Employee can view their Payroll
exports.getMyPayroll = async (req, res) => {
  try {
    const decoded = verifyToken(req);

    const payrolls = await Payroll.find({ user: decoded.id }).sort({ month: -1 });

    if (!payrolls || payrolls.length === 0) {
      return res
        .status(404)
        .json({ status: 404, message: "No payroll records found" });
    }

    return res.status(200).json({
      status: 200,
      message: "Your payroll records",
      payrolls,
    });
  } catch (error) {
    console.error("GetMyPayroll Error:", error);
    return res.status(500).json({ status: 500, message: error.message });
  }
};


// 🧮 Salary Calculation Helper
const calculateSalary = (records, baseSalary) => {
  let presentDays = 0,
    absentDays = 0,
    halfDays = 0,
    overTimeHours = 0;

  records.forEach((rec) => {
    if (rec.isLeave) {
      if (rec.leaveStatus === "approved") {
        absentDays += 1;
      }
    } else {
      if (rec.intime && rec.outtime) {
        const inTimeMoment = moment(rec.intime, "HH:mm");
        const outTimeMoment = moment(rec.outtime, "HH:mm");
        const hoursWorked = outTimeMoment.diff(inTimeMoment, "hours");

        if (hoursWorked < 4) {
          halfDays += 1;
        } else {
          presentDays += 1;
        }

        if (hoursWorked > 9) {
          overTimeHours += hoursWorked - 9;
        }
      } else {
        absentDays += 1;
      }
    }
  });

  const workingDays = presentDays + absentDays + halfDays;
  const perDaySalary = baseSalary / (workingDays || 1);
  const halfDayDeduction = (perDaySalary / 2) * halfDays;
  const fullDayDeduction = perDaySalary * absentDays;

  const leaveDeduction = halfDayDeduction + fullDayDeduction;
  const overtimePay = overTimeHours * (perDaySalary / 8); // 8 hrs/day
  const finalSalary = baseSalary - leaveDeduction + overtimePay;

  return {
    workingDays,
    presentDays,
    absentDays,
    halfDays,
    overTimeHours,
    leaveDeduction,
    overtimePay,
    finalSalary,
  };
};

// 📌 Auto Payroll Generation for All Employees
exports.generateMonthlyPayroll = async (req, res) => {
  try {
    const decoded = verifyAdminHRToken(req);

    const { month } = req.body; // e.g. "2025-08"
    if (!month) {
      return res.status(400).json({ status: 400, message: "Month is required (YYYY-MM)" });
    }

    const startDate = moment(month + "-01").startOf("month").format("YYYY-MM-DD");
    const endDate = moment(month + "-01").endOf("month").format("YYYY-MM-DD");

    const users = await User.find({ role: "employee" }); // Only employees
    if (!users || users.length === 0) {
      return res.status(404).json({ status: 404, message: "No employees found" });
    }

    let payrolls = [];

    for (const user of users) {
      const records = await Attendance.find({
        user: user._id,
        date: { $gte: startDate, $lte: endDate },
      });

      if (records.length === 0) continue;

      const baseSalary = user.baseSalary || 20000; // fallback if salary not in user model
      const salaryData = calculateSalary(records, baseSalary);

      const payroll = await Payroll.create({
        user: user._id,
        month,
        baseSalary,
        ...salaryData,
        calculatedBy: decoded.id,
      });

      payrolls.push(payroll);
    }

    return res.status(201).json({
      status: 201,
      message: `Payroll generated for ${payrolls.length} employees for ${month}`,
      payrolls,
    });
  } catch (error) {
    console.error("GenerateMonthlyPayroll Error:", error);
    return res.status(500).json({ status: 500, message: error.message });
  }
};