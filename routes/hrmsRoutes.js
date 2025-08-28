const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadProfile");
const {
  punchIn,
  punchOut,
  getUserAttendance,
  getAllAttendance,
  updateLeaveRequest,
  updateUserStatus,
  deleteUserRecord,
} = require("../controllers/hrmsController");

// Punch In (POST)
router.post("/attendance/punchin", upload.single("selfie"), punchIn);

// Punch Out (PUT)
router.put("/attendance/punchout/:id", punchOut);

// User's own attendance
router.get("/attendance/me", getUserAttendance);

// All employees attendance (Admin)
router.get("/attendance", getAllAttendance);

// Leave management
router.put('/leave/:leaveId', updateLeaveRequest);

// User Management (Admin/HR only)
router.put('/users/:userId/status', updateUserStatus);
router.delete('/users/:userId', deleteUserRecord);

module.exports = router;
