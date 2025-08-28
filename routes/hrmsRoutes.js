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
  requestLeave,
  getLeaveRequestsByUser,
  getAllLeaveRequests,
  getPunchDetails,

} = require("../controllers/hrmsController");

// Punch In (POST)
router.post("/attendance/punchin", upload.single("selfie"), punchIn);

// Punch Out (PUT)
router.put("/attendance/punchout/:id", punchOut);
// Get punch details
router.get("/attendance", getPunchDetails);

// User's own attendance
router.get("/attendance/me", getUserAttendance);

// All employees attendance (Admin)
router.get("/attendance", getAllAttendance);

// Leave management
router.put('/leave/:leaveId', updateLeaveRequest);

// User Management (Admin/HR only)
router.put('/users/:userId/status', updateUserStatus);
router.delete('/users/:userId', deleteUserRecord);
router.post("/leave/request", requestLeave);
// Leave management
router.get("/leave", getAllLeaveRequests); // Admin/HR only
router.get("/leave/me", getLeaveRequestsByUser); // User/Employee only



module.exports = router;
