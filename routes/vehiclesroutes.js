const express = require("express");
const router = express.Router();

const upload = require("../middlewares/cloudinaryUpload");
const { verifyAdminHRToken } = require("../middlewares/auth");
const vehicleController = require("../controllers/vehicleController");

// CREATE
router.post("/vehicles", (req, res, next) => {
  try {
    verifyAdminHRToken(req);
    next();
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
}, upload.array("images", 5), vehicleController.createVehicle);

// READ ALL
router.get("/vehicles", vehicleController.getVehicles);

// READ ONE
router.get("/vehicles/:id", vehicleController.getVehicleById);

// UPDATE
router.put("/vehicles/:id", (req, res, next) => {
  try {
    verifyAdminHRToken(req);
    next();
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
}, upload.array("images", 5), vehicleController.updateVehicle);

// PATCH STATUS
router.patch("/vehicles/:id/status", (req, res, next) => {
  try {
    verifyAdminHRToken(req);
    next();
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
}, vehicleController.patchVehicleStatus);

// DELETE
router.delete("/vehicles/:id", (req, res, next) => {
  try {
    verifyAdminHRToken(req);
    next();
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
}, vehicleController.deleteVehicle);

module.exports = router;
