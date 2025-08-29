const Vehicle = require("../models/vehicle");

// Create Vehicle Entry
exports.createVehicle = async (req, res) => {
  try {
    const {
      type, dateTime, transporterName, vehicleCapacity,
      vehicleSize, vehicleBodyType, vehicleNo,
      vehicleDriverNo, driverName, from, to,
      companyFrom, companyTo, vehicleOutDateTime, amount
    } = req.body;

    const imageUrls = req.files?.map(file => file.path) || [];

    const vehicle = new Vehicle({
      type, dateTime, transporterName, vehicleCapacity,
      vehicleSize, vehicleBodyType, vehicleNo,
      vehicleDriverNo, driverName, from, to,
      companyFrom, companyTo, vehicleOutDateTime, amount,
      images: imageUrls
    });

    await vehicle.save();
    res.status(201).json({ message: "Vehicle entry created (Pending)", vehicle });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Vehicles
exports.getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Single Vehicle
exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Vehicle
exports.updateVehicle = async (req, res) => {
  try {
    const imageUrls = req.files?.map(file => file.path) || [];
    const updatedData = { ...req.body };
    if (imageUrls.length > 0) updatedData.images = imageUrls;

    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    res.json({ message: "Vehicle updated successfully", vehicle });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Patch Status (Pending → Complete)
exports.patchVehicleStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Pending", "Complete"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    res.json({ message: `Vehicle status updated to ${status}`, vehicle });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Vehicle
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
