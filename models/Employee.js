const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  number: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true }, // optional
  address: { type: String, required: true },
  companyName: { type: String, required: true },
  workingHours: { type: String, required: true },
  workingDays: { type: String, required: true },
  department: { type: String, required: true },
  role: { type: String, required: true },
  salary: { type: Number, required: true },
  leave: { type: Number, default: 0 }, // default leave balance
  password: { type: String, required: true }, // hashed
  media: [{ type: String }],
  // models/attendance.js
// add these fields to your existing schema
leaveType: { type: String, enum: ["CL", "SL", "PL", "UL"], default: undefined }, // Casual, Sick, Paid(??), Unpaid
leaveApproved: { type: Boolean, default: false }, // if you want approval gate

}, { timestamps: true });

// hash password before save
employeeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// method to compare password
employeeSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Employee", employeeSchema);
