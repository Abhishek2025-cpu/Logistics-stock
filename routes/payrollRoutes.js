const express = require("express");
const router = express.Router();
const { generateSalary, getMySalary, getAllSalaries } = require("../controllers/payrollController");

// HR/Admin generates salary for a user
router.post("/salary/generate/:userId", generateSalary);

// Employee views their salaries
router.get("/salary/me", getMySalary);

// HR/Admin gets all salaries
router.get("/salary", getAllSalaries);

module.exports = router;
