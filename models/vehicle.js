const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
  type: { type: String, enum: ["Loading", "Unloading", "Loading/Unloading"], required: true },
  dateTime: { type: Date, required: true },

  transporterName: { type: String, required: true },
  vehicleCapacity: { type: String, required: true },
  vehicleSize: { type: String, required: true },
  vehicleBodyType: { type: String, required: true },
  vehicleNo: { type: String, required: true },
  vehicleDriverNo: { type: String, required: true },
  driverName: { type: String, required: true },

  from: { type: String, required: true },
  to: { type: String, required: true },
  companyFrom: { type: String, required: true },
  companyTo: { type: String, required: true },

  vehicleOutDateTime: { type: Date, required: true },
  amount: { type: Number, required: true },

  images: [{ type: String }],

  status: { type: String, enum: ["Pending", "Complete"], default: "Pending" }
}, { timestamps: true });

module.exports = mongoose.model("Vehicle", vehicleSchema);
