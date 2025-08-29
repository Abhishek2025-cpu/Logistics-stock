const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");

// Helper: get today date string
const todayStr = () => new Date().toISOString().split("T")[0];

// Punch In (Employee)
exports.punchIn = async (req, res) => {
  try {
    const employee = req.user; // from token middleware
    const selfie = req.file?.path;
    const now = new Date();

    let attendance = await Attendance.findOne({ employee: employee._id, date: todayStr() });
    if (attendance && attendance.punchIn) {
      return res.status(400).json({ message: "Already punched in today" });
    }

    attendance = new Attendance({
      employee: employee._id,
      date: todayStr(),
      punchIn: now,
      punchInSelfie: selfie
    });

    // Check late > 15 minutes
    const startHour = parseInt(employee.workingHours.split("-")[0]); // crude parse
    const punchHour = now.getHours();
    const punchMin = now.getMinutes();
    let isLate = false;

    if (punchHour > startHour || (punchHour === startHour && punchMin > 15)) {
      attendance.warnings = 1;
    }

    await attendance.save();
    res.status(201).json({ message: "Punch In recorded", attendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Punch Out (Employee)
exports.punchOut = async (req, res) => {
  try {
    const employee = req.user;
    const selfie = req.file?.path;
    const now = new Date();

    const attendance = await Attendance.findOne({ employee: employee._id, date: todayStr() });
    if (!attendance || !attendance.punchIn) {
      return res.status(400).json({ message: "Punch in not found for today" });
    }

    attendance.punchOut = now;
    attendance.punchOutSelfie = selfie;

    // decide status (P, A, HD)
    const workHours = employee.workingHours; // e.g. "9am-6pm"
    const [start, end] = workHours.split("-");
    const startH = parseInt(start);
    const endH = parseInt(end);
    const actualHours = (attendance.punchOut - attendance.punchIn) / (1000 * 60 * 60);

    if (actualHours >= (endH - startH)) {
      attendance.status = "P";
    } else if (actualHours >= (endH - startH) / 2) {
      attendance.status = "HD";
    } else {
      attendance.status = "A";
    }

    await attendance.save();
    res.json({ message: "Punch Out recorded", attendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Manual Correction (HR/Admin only)
exports.correctAttendance = async (req, res) => {
  try {
    const { employeeId, date, punchIn, punchOut } = req.body;

    let attendance = await Attendance.findOne({ employee: employeeId, date });
    if (!attendance) {
      attendance = new Attendance({ employee: employeeId, date });
    }

    attendance.punchIn = punchIn ? new Date(punchIn) : attendance.punchIn;
    attendance.punchOut = punchOut ? new Date(punchOut) : attendance.punchOut;

    // recalc status
    if (attendance.punchIn && attendance.punchOut) {
      const actualHours = (attendance.punchOut - attendance.punchIn) / (1000 * 60 * 60);
      const employee = await Employee.findById(employeeId);
      const [start, end] = employee.workingHours.split("-");
      const startH = parseInt(start);
      const endH = parseInt(end);

      if (actualHours >= (endH - startH)) {
        attendance.status = "P";
      } else if (actualHours >= (endH - startH) / 2) {
        attendance.status = "HD";
      } else {
        attendance.status = "A";
      }
    }

    await attendance.save();
    res.json({ message: "Attendance corrected by HR/Admin", attendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
