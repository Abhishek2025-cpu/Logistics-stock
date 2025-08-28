const express = require("express");
const router = express.Router();
const { generatePayroll, getPayrollByUser, getMyPayroll } = require("../controllers/payrollController");

// HR/Admin generates salary for a user
router.post("/salary/generate/:userId", generatePayroll);

// Employee views their salaries
router.get("/salary/me", getPayrollByUser);

// HR/Admin gets all salaries
router.get("/salary", getMyPayroll);

module.exports = router;
