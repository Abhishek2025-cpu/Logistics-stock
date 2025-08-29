const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadProfile");
const { verifyToken, verifyAdminHRToken } = require("../middleware/auth");
const attendanceController = require("../controllers/attendanceController");

// Punch In (Employee only)
router.post("/attendance/punch-in", (req, res, next) => {
  try {
    const decoded = verifyToken(req);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
}, upload.single("selfie"), attendanceController.punchIn);

// Punch Out (Employee only)
router.put("/attendance/punch-out", (req, res, next) => {
  try {
    const decoded = verifyToken(req);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
}, upload.single("selfie"), attendanceController.punchOut);

// Correct Attendance (HR/Admin only)
router.patch("/attendance/correct", (req, res, next) => {
  try {
    verifyAdminHRToken(req);
    next();
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
}, attendanceController.correctAttendance);

module.exports = router;
