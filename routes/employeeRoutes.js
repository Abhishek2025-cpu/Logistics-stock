const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const employeeController = require("../controllers/employeeController");

// Admin/HR CRUD
router.post("/register", upload.single("profilePic"), employeeController.registerEmployee);
router.get("/", employeeController.getAllEmployees);
router.put("/:employeeId", upload.single("profilePic"), employeeController.updateEmployee);
router.delete("/:employeeId", employeeController.deleteEmployee);
router.patch("/:employeeId/toggle-status", employeeController.toggleEmployeeStatus);

// Employee Login
router.post("/signin", employeeController.employeeSignIn);

module.exports = router;
