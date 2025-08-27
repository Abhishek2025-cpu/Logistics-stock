const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadProfile");
const {
  punchIn,
  punchOut,
  getUserAttendance,
  getAllAttendance,
} = require("../controllers/hrmsController");

// Punch In (POST)
router.post("/attendance/punchin", upload.single("selfie"), punchIn);

// Punch Out (PUT)
router.put("/attendance/punchout/:id", punchOut);

// User's own attendance
router.get("/attendance/me", getUserAttendance);

// All employees attendance (Admin)
router.get("/attendance", getAllAttendance);

module.exports = router;
