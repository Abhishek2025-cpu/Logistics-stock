const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    Name: { type: String, required: true },
  },
  { timestamps: true }
);

const Department__Modal = mongoose.model("Department", departmentSchema);

module.exports = Department__Modal;
