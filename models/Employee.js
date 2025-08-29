const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  number: { type: String, required: true },
  email: { type: String },
  address: { type: String, required: true },
  companyName: { type: String, required: true },
  workingHours: { type: String, required: true },
  workingDays: { type: String, required: true },
  department: { type: String, required: true },
  role: { type: String, required: true },
  salary: { type: Number, required: true },
  media: [{ type: String }], // Array of Cloudinary image URLs
}, { timestamps: true });

module.exports = mongoose.model("Employee", employeeSchema);
