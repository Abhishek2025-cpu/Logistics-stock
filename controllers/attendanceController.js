const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");

// Helper: get today date string
const todayStr = () => new Date().toISOString().split("T")[0];

// Punch In (Employee)
exports.punchIn = async (req, res) => {
  try {
    const decoded = req.user; // comes from verifyToken
    const employee = await Employee.findById(decoded.id); // get full record
    if (!employee) return res.status(404).json({ message: "Employee not found" });

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

    // Parse workingHours properly
    // Example: "9am - 6pm" → start = 9
    let isLate = false;
    if (employee.workingHours) {
      const startTime = employee.workingHours.split("-")[0].trim(); // e.g. "9am"
      const match = startTime.match(/(\d+)(am|pm)?/i);
      if (match) {
        let startHour = parseInt(match[1]);
        const meridian = match[2]?.toLowerCase();
        if (meridian === "pm" && startHour < 12) startHour += 12;
        if (meridian === "am" && startHour === 12) startHour = 0;

        const punchHour = now.getHours();
        const punchMin = now.getMinutes();

        if (punchHour > startHour || (punchHour === startHour && punchMin > 15)) {
          attendance.warnings = 1;
          isLate = true;
        }
      }
    }

    await attendance.save();
    res.status(201).json({
      message: isLate ? "Punch In recorded (Late)" : "Punch In recorded",
      attendance
    });
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
