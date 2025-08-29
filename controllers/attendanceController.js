const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");

// Helper: get today date string
const todayStr = () => new Date().toISOString().split("T")[0];

// Punch In (Employee)
exports.punchIn = async (req, res) => {
  try {
    const decoded = req.user; // comes from verifyToken
    const employee = await Employee.findById(decoded.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const selfie = req.file?.path;
    const now = new Date();

    // ensure unique attendance per day
    let attendance = await Attendance.findOne({ 
      employee: employee._id, 
      date: todayStr() 
    });
    if (attendance && attendance.punchIn) {
      return res.status(400).json({ message: "Already punched in today" });
    }

    attendance = new Attendance({
      employee: employee._id,
      date: todayStr(),
      punchIn: now,
      punchInSelfie: selfie
    });

    // Check late (beyond 15 min of working start)
    let isLate = false;
    if (employee.workingHours) {
      const startTime = employee.workingHours.split("-")[0].trim(); // e.g. "9am"
      const match = startTime.match(/(\d+)(am|pm)?/i);
      if (match) {
        let startHour = parseInt(match[1]);
        const meridian = match[2]?.toLowerCase();
        if (meridian === "pm" && startHour < 12) startHour += 12;
        if (meridian === "am" && startHour === 12) startHour = 0;

        const punchInTotalMin = now.getHours() * 60 + now.getMinutes();
        const startTotalMin = startHour * 60; // assuming startMin = 0 unless provided

        if (punchInTotalMin > startTotalMin + 15) {
          attendance.warnings = (attendance.warnings || 0) + 1;
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
    const decoded = req.user; // employee token
    const todayStr = new Date().toISOString().split("T")[0];

    let attendance = await Attendance.findOne({
      employee: decoded.id,
      date: todayStr
    });

    if (!attendance) {
      return res.status(404).json({ message: "Punch in not found for today" });
    }

    attendance.punchOut = new Date();
    attendance.punchOutSelfie = req.file?.path;

    // Fetch employee working hours
    const employee = await Employee.findById(decoded.id);
    let status = "A";

    if (attendance.punchIn && attendance.punchOut) {
      const workHours = employee.workingHours || "09:00-18:00"; // fallback
      const [startStr, endStr] = workHours.split("-");
      
      // Convert to minutes
      const [startH, startM] = startStr.split(":").map(Number);
      const [endH, endM] = endStr.split(":").map(Number);
      const requiredMinutes = (endH * 60 + endM) - (startH * 60 + startM);

      // Calculate actual worked minutes
      const workedMinutes = Math.floor(
        (attendance.punchOut - attendance.punchIn) / (1000 * 60)
      );

      // Check late by >15 minutes
      const punchInHour = attendance.punchIn.getHours();
      const punchInMin = attendance.punchIn.getMinutes();
      const startTotalMin = startH * 60 + startM;
      const punchInTotalMin = punchInHour * 60 + punchInMin;

      if (punchInTotalMin > startTotalMin + 15) {
        attendance.warnings = (attendance.warnings || 0) + 1;
      }

      // Decide Status
      if (workedMinutes >= requiredMinutes) {
        status = "P"; // Present
      } else if (workedMinutes >= requiredMinutes / 2) {
        status = "HD"; // Half Day
      } else {
        status = "A"; // Absent
      }
    }

    attendance.status = status;

    await attendance.save();

    res.json({
      message: "Punch Out recorded successfully",
      attendance
    });

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
