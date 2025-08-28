const Attendance = require("../models/Attendance");
const User = require("../models/User");     
const jwt = require("jsonwebtoken");
const moment = require("moment-timezone");

const verifyToken = (req) => {
  const token = req.headers["authorization"];
  if (!token) throw new Error("Authorization token required");
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Helper function to verify Admin or HR token, case-insensitive
const verifyAdminHRToken = (req) => {
  const decoded = verifyToken(req);
  const userRole = decoded.role ? decoded.role.toLowerCase() : '';

  if (userRole !== 'admin' && userRole !== 'hr') {
    throw new Error("Unauthorized: Only Admin or HR can perform this action");
  }
  return decoded;
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


// 1. API for approving and rejecting leave requests (now using Attendance model)
exports.updateLeaveRequest = async (req, res) => {
  try {
    const decoded = verifyAdminHRToken(req); // Only Admin/HR can access
    const { leaveId } = req.params;  // use leaveId instead of attendanceId
    const { status, remarks } = req.body; // status can be 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        status: 400, 
        message: "Invalid status. Must be 'approved' or 'rejected'." 
      });
    }

    // Find the leave record by _id where isLeave = true
    const leaveRecord = await Attendance.findOne({ _id: leaveId, isLeave: true });

    if (!leaveRecord) {
      return res.status(404).json({ 
        status: 404, 
        message: "Leave record not found or is not a leave request." 
      });
    }

    // Check if already processed
    if (leaveRecord.leaveStatus !== 'pending') {
      return res.status(400).json({ 
        status: 400, 
        message: `Leave request has already been ${leaveRecord.leaveStatus}.` 
      });
    }

    // Update leave status
    leaveRecord.leaveStatus = status;
    leaveRecord.adminRemarks = remarks || ""; // 👈 Better: keep separate adminRemarks field
    leaveRecord.reviewedBy = decoded.id;
    leaveRecord.reviewedAt = moment().tz("Asia/Kolkata").toDate();

    await leaveRecord.save();

    return res.status(200).json({
      status: 200,
      message: `Leave request ${status} successfully.`,
      leaveRecord,
    });
  } catch (error) {
    console.error("updateLeaveRequest Error:", error);
    return res.status(error.message.includes("Unauthorized") ? 403 : 500).json({ 
      status: error.message.includes("Unauthorized") ? 403 : 500, 
      message: error.message 
    });
  }
};



// 2. API to make employees status as active/inactive with date and time
// 1. API to update user status (active/inactive)
exports.updateUserStatus = async (req, res) => {
  try {
    const decoded = verifyAdminHRToken(req); // Only Admin/HR can access
    const { userId } = req.params;
    const { isActive } = req.body; // boolean: true for active, false for inactive

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ status: 400, message: "Invalid 'isActive' value. Must be true or false." });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found." });
    }

    user.isActive = isActive;
    if (isActive) {
      user.activatedAt = moment().tz("Asia/Kolkata").toDate();
      user.deactivatedAt = undefined;
    } else {
      user.deactivatedAt = moment().tz("Asia/Kolkata").toDate();
      user.activatedAt = undefined;
    }
    await user.save();

    return res.status(200).json({
      status: 200,
      message: `User status updated to ${isActive ? 'active' : 'inactive'} successfully.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        activatedAt: user.activatedAt,
        deactivatedAt: user.deactivatedAt,
      },
    });
  } catch (error) {
    console.error("updateUserStatus Error:", error);
    return res.status(error.message.includes("Unauthorized") ? 403 : 500).json({
      status: error.message.includes("Unauthorized") ? 403 : 500,
      message: error.message
    });
  }
};


// 2. API to delete user record permanently
exports.deleteUserRecord = async (req, res) => {
  try {
    const decoded = verifyAdminHRToken(req); // Only Admin/HR can access
    const { userId } = req.params;

    if (decoded.id.toString() === userId) {
      return res.status(403).json({ status: 403, message: "You cannot delete your own account via this API." });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found." });
    }

    // ⭐ Delete associated attendance/leave records as well
    await Attendance.deleteMany({ user: userId });

    return res.status(200).json({
      status: 200,
      message: "User record deleted permanently.",
      deletedUser: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("deleteUserRecord Error:", error);
    return res.status(error.message.includes("Unauthorized") ? 403 : 500).json({
      status: error.message.includes("Unauthorized") ? 403 : 500,
      message: error.message
    });
  }
};



exports.requestLeave = async (req, res) => {
  try {
    const decoded = verifyToken(req); // Decode employee/user from JWT
    const { empCode, empName, leaveType, reason, selectedDate } = req.body;

    if (!empCode || !empName || !leaveType || !reason || !selectedDate) {
      return res.status(400).json({
        status: 400,
        message: "empCode, empName, leaveType, reason, and selectedDate are required.",
      });
    }

    // Ensure user exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found." });
    }

    // Prevent duplicate attendance/leave for the same date
    const existingEntry = await Attendance.findOne({
      user: decoded.id,
      date: selectedDate,
    });

    if (existingEntry) {
      return res.status(400).json({
        status: 400,
        message: "You already have an attendance or leave record for this date.",
      });
    }

    // Create leave request
    const leaveRequest = await Attendance.create({
      user: decoded.id,
      empCode,
      empName,
      date: selectedDate,
      day: moment(selectedDate).tz("Asia/Kolkata").format("dddd"),
      isLeave: true,
      leaveType,
      leaveReason: reason,
      leaveStatus: "pending", // Default: pending
    });

    return res.status(201).json({
      status: 201,
      message: "Leave request submitted successfully.",
      leaveRequest,
    });
  } catch (error) {
    console.error("requestLeave Error:", error);
    return res.status(500).json({ status: 500, message: error.message });
  }
};