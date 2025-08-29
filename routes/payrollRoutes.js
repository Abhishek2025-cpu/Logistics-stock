// routes.js
const { verifyAdminHRToken } = require("../middleware/auth");
const payrollController = require("../controllers/payrollController");
const express = require("express");
const router = express.Router();

// Generate payroll for a month (all employees or single)
router.post("/generate", (req, res, next) => {
  try { verifyAdminHRToken(req); next(); } catch (e) { return res.status(401).json({ error: e.message }); }
}, payrollController.generateMonthlyPayroll);

// List / filter payrolls
router.get("/payroll", (req, res, next) => {
  try { verifyAdminHRToken(req); next(); } catch (e) { return res.status(401).json({ error: e.message }); }
}, payrollController.getPayrolls);

// Single payroll
router.get("/payroll/:id", payrollController.getPayrollById);

// Adjust (approve, tweak deductions, notes)
router.patch("/payroll/:id", (req, res, next) => {
  try { verifyAdminHRToken(req); next(); } catch (e) { return res.status(401).json({ error: e.message }); }
}, payrollController.patchPayroll);

// Disburse (mark as Paid)
router.post("/payroll/:id/disburse", (req, res, next) => {
  try { verifyAdminHRToken(req); next(); } catch (e) { return res.status(401).json({ error: e.message }); }
}, payrollController.disbursePayroll);

module.exports = router;
