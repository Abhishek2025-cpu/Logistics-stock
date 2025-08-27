const Attendance = require("../models/Attendance");
const jwt = require("jsonwebtoken");
const moment = require("moment-timezone");

const verifyToken = (req) => {
  const token = req.headers["authorization"];
  if (!token) throw new Error("Authorization token required");
  return jwt.verify(token, process.env.JWT_SECRET);
};

// 📌 Punch In API
// 📌 Punch In API
exports.punchIn = async (req, res) => {
  try {
    const decoded = verifyToken(req);

    if (!req.file || !req.file.path) {
      return res.status(400).json({ status: 400, message: "Selfie is required" });
    }

    const now = moment().tz("Asia/Kolkata");
    const date = now.format("YYYY-MM-DD");
    const day = now.format("dddd");
    const intime = now.format("HH:mm");

    // 🔹 Removed the "before 10 AM" restriction for now
    const existingAttendance = await Attendance.findOne({ user: decoded.id, date });
    if (existingAttendance) {
      return res.status(400).json({
        status: 400,
        message: "You have already punched in today",
      });
    }

    const attendance = await Attendance.create({
      user: decoded.id,
      selfie: req.file.path, // Cloudinary URL
      intime,
      date,
      day,
    });

    return res.status(201).json({
      status: 201,
      message: "Punch-in successful",
      attendance,
    });
  } catch (error) {
    console.error("PunchIn Error:", error); // 👈 Add this for debugging
    return res.status(500).json({ status: 500, message: error.message });
  }
};


// 📌 Punch Out API
exports.punchOut = async (req, res) => {
  try {
    const decoded = verifyToken(req);

    const now = moment().tz("Asia/Kolkata");
    const outtime = now.format("HH:mm");


    const attendance = await Attendance.findOne({
      _id: req.params.id,
      user: decoded.id,
    });

    if (!attendance) {
      return res.status(404).json({
        status: 404,
        message: "Attendance record not found",
      });
    }

    if (attendance.outtime) {
      return res.status(400).json({
        status: 400,
        message: "You have already punched out today",
      });
    }

    attendance.outtime = outtime;
    await attendance.save();

    return res.status(200).json({
      status: 200,
      message: "Punch-out successful",
      attendance,
    });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

// 📌 Get User Attendance
exports.getUserAttendance = async (req, res) => {
  try {
    const decoded = verifyToken(req);

    const records = await Attendance.find({ user: decoded.id }).sort({ createdAt: -1 });

    return res.status(200).json({
      status: 200,
      attendance: records,
    });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

// 📌 Get All Attendance (Admin)
exports.getAllAttendance = async (req, res) => {
  try {
    const records = await Attendance.find().populate("user", "name email role").sort({ createdAt: -1 });

    return res.status(200).json({
      status: 200,
      attendance: records,
    });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};
