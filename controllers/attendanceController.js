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

    let status = "A"; // default absent
    let requiredMinutes = 8 * 60; // default 8 hours
    let startH = 9, startM = 0, endH = 18, endM = 0; // default 09:00–18:00

    if (employee.workingHours) {
      const workHours = employee.workingHours.trim();

      // Case 1: format "09:00-18:00"
      if (workHours.includes(":") && workHours.includes("-")) {
        const [startStr, endStr] = workHours.split("-");
        const [sh, sm] = startStr.split(":").map(Number);
        const [eh, em] = endStr.split(":").map(Number);

        startH = sh ?? 9;
        startM = sm ?? 0;
        endH = eh ?? 18;
        endM = em ?? 0;

        requiredMinutes = (endH * 60 + endM) - (startH * 60 + startM);
      }
      // Case 2: format "9am - 6pm"
      else if (/am|pm/i.test(workHours)) {
        const parts = workHours.split("-");
        if (parts.length === 2) {
          const parseAmPm = (str) => {
            const match = str.trim().match(/(\d+)(?::(\d+))?\s*(am|pm)/i);
            if (!match) return { h: 9, m: 0 };
            let h = parseInt(match[1]);
            const m = parseInt(match[2] || "0");
            const meridian = match[3].toLowerCase();
            if (meridian === "pm" && h < 12) h += 12;
            if (meridian === "am" && h === 12) h = 0;
            return { h, m };
          };
          const start = parseAmPm(parts[0]);
          const end = parseAmPm(parts[1]);

          startH = start.h;
          startM = start.m;
          endH = end.h;
          endM = end.m;

          requiredMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        }
      }
    }

  if (attendance.punchIn && attendance.punchOut) {
  // Calculate actual worked minutes
  const workedMinutes = Math.floor(
    (attendance.punchOut - attendance.punchIn) / (1000 * 60)
  );

  // Check late punch-in
  const punchInTotalMin =
    attendance.punchIn.getHours() * 60 + attendance.punchIn.getMinutes();
  const startTotalMin = startH * 60 + startM;

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

  // ✅ Overtime Calculation
  let otMinutes = 0;
  if (workedMinutes > requiredMinutes) {
    otMinutes = workedMinutes - requiredMinutes;
  }
  attendance.otMinutes = otMinutes;
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

    if (punchIn) attendance.punchIn = new Date(punchIn);
    if (punchOut) attendance.punchOut = new Date(punchOut);

    let workedMinutes = 0;
    let requiredMinutes = 8 * 60; // default 8 hours
    let otMinutes = 0;

    if (attendance.punchIn && attendance.punchOut) {
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      let startH = 9,
        startM = 0,
        endH = 18,
        endM = 0;

      if (employee.workingHours) {
        const workHours = employee.workingHours.trim();

        // Case 1: "09:00-18:00"
        if (workHours.includes(":") && workHours.includes("-")) {
          const [startStr, endStr] = workHours.split("-");
          const [sh, sm] = startStr.split(":").map(Number);
          const [eh, em] = endStr.split(":").map(Number);

          startH = sh ?? 9;
          startM = sm ?? 0;
          endH = eh ?? 18;
          endM = em ?? 0;

          requiredMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        }
        // Case 2: "9am - 6pm"
        else if (/am|pm/i.test(workHours)) {
          const parts = workHours.split("-");
          if (parts.length === 2) {
            const parseAmPm = (str) => {
              const match = str.trim().match(/(\d+)(?::(\d+))?\s*(am|pm)/i);
              if (!match) return { h: 9, m: 0 };
              let h = parseInt(match[1]);
              const m = parseInt(match[2] || "0");
              const meridian = match[3].toLowerCase();
              if (meridian === "pm" && h < 12) h += 12;
              if (meridian === "am" && h === 12) h = 0;
              return { h, m };
            };
            const start = parseAmPm(parts[0]);
            const end = parseAmPm(parts[1]);

            startH = start.h;
            startM = start.m;
            endH = end.h;
            endM = end.m;

            requiredMinutes = (endH * 60 + endM) - (startH * 60 + startM);
          }
        }
      }

      // Actual worked minutes
      workedMinutes = Math.floor(
        (attendance.punchOut - attendance.punchIn) / (1000 * 60)
      );

      // Decide status
      if (workedMinutes >= requiredMinutes) {
        attendance.status = "P"; // Present
      } else if (workedMinutes >= requiredMinutes / 2) {
        attendance.status = "HD"; // Half Day
      } else {
        attendance.status = "A"; // Absent
      }

      // Overtime
      if (workedMinutes > requiredMinutes) {
        otMinutes = workedMinutes - requiredMinutes;
      }
    }

    attendance.otMinutes = otMinutes;

    await attendance.save();
    res.json({ message: "Attendance corrected by HR/Admin", attendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


