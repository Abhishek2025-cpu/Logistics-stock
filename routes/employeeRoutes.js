const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadProfile"); 
const { verifyAdminHRToken } = require("../middleware/auth");
const employeeController = require("../controllers/employeeController");

// CREATE
router.post("/employees", (req, res, next) => {
  try {
    verifyAdminHRToken(req);
    next();
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
}, upload.array("media", 5), employeeController.createEmployee);

// EMPLOYEE LOGIN
router.post("/employees/login", employeeController.loginEmployee);
router.post("/employees/login-universal", employeeController.universalLogin);


// READ ALL
router.get("/get-employees", employeeController.getEmployees);

// READ ONE
router.get("/employee/:id", employeeController.getEmployeeById);

// UPDATE
router.put("/update-employee/:id", (req, res, next) => {
  try {
    verifyAdminHRToken(req);
    next();
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
}, upload.array("media", 5), employeeController.updateEmployee);

// DELETE
router.delete("/delete-employees/:id", (req, res, next) => {
  try {
    verifyAdminHRToken(req);
    next();
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
}, employeeController.deleteEmployee);

module.exports = router;
