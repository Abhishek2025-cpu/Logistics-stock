const Attendance = require("../models/Attendance");
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
    const { attendanceId } = req.params; // Changed from leaveId to attendanceId
    const { status, remarks } = req.body; // status can be 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ status: 400, message: "Invalid status. Must be 'approved' or 'rejected'." });
    }

    // Find the attendance record that is also a leave request
    const leaveRecord = await Attendance.findOne({ _id: attendanceId, isLeave: true });

    if (!leaveRecord) {
      return res.status(404).json({ status: 404, message: "Leave record not found or is not a leave request." });
    }

    // Check if the leave has already been processed
    if (leaveRecord.leaveStatus !== 'pending') {
      return res.status(400).json({ status: 400, message: `Leave request has already been ${leaveRecord.leaveStatus}.` });
    }

    leaveRecord.leaveStatus = status;
    // We can use the 'remarks' from the request body as the 'leaveReason' if needed
    // Or, if 'remarks' is specifically for admin comments, we could add another field.
    // For now, let's update the existing 'leaveReason' or add it as an admin_remarks if you add a new field.
    // If you want admin-specific remarks, add a new field like `adminRemarks` to the Attendance model.
    // leaveRecord.adminRemarks = remarks || '';
    // For simplicity, let's assume 'remarks' here is the final reason/comment for approval/rejection.
    leaveRecord.leaveReason = remarks || leaveRecord.leaveReason; // Update or keep original if no new remarks

    leaveRecord.reviewedBy = decoded.id; // Store who reviewed it
    leaveRecord.reviewedAt = moment().tz("Asia/Kolkata").toDate();

    await leaveRecord.save();

    return res.status(200).json({
      status: 200,
      message: `Leave request ${status} successfully.`,
      leaveRecord,
    });
  } catch (error) {
    console.error("UpdateLeaveRequest Error:", error);
    return res.status(error.message.includes("Unauthorized") ? 403 : 500).json({ status: error.message.includes("Unauthorized") ? 403 : 500, message: error.message });
  }
};


// 2. API to make employees status as active/inactive with date and time
exports.updateEmployeeStatus = async (req, res) => {
  try {
    const decoded = verifyAdminHRToken(req); // Only Admin/HR can access
    const { employeeId } = req.params;
    const { isActive } = req.body; // boolean: true for active, false for inactive

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ status: 400, message: "Invalid 'isActive' value. Must be true or false." });
    }

    const user = await User.findById(employeeId);

    if (!user) {
      return res.status(404).json({ status: 404, message: "Employee not found." });
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
      message: `Employee status updated to ${isActive ? 'active' : 'inactive'} successfully.`,
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
    console.error("UpdateEmployeeStatus Error:", error);
    return res.status(error.message.includes("Unauthorized") ? 403 : 500).json({ status: error.message.includes("Unauthorized") ? 403 : 500, message: error.message });
  }
};

// 3. API to delete employees record permanently
exports.deleteEmployeeRecord = async (req, res) => {
  try {
    const decoded = verifyAdminHRToken(req); // Only Admin/HR can access
    const { employeeId } = req.params;

    if (decoded.id.toString() === employeeId) {
        return res.status(403).json({ status: 403, message: "You cannot delete your own account via this API." });
    }

    const user = await User.findByIdAndDelete(employeeId);

    if (!user) {
      return res.status(404).json({ status: 404, message: "Employee not found." });
    }

    // ⭐ IMPORTANT: Delete associated attendance/leave records as well
    await Attendance.deleteMany({ user: employeeId });

    return res.status(200).json({
      status: 200,
      message: "Employee record deleted permanently.",
      deletedUser: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("DeleteEmployeeRecord Error:", error);
    return res.status(error.message.includes("Unauthorized") ? 403 : 500).json({ status: error.message.includes("Unauthorized") ? 403 : 500, message: error.message });
  }
};