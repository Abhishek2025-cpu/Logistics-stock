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
  leave: { type: Number, default: 0 }, // leave balance
  password: { type: String, required: true }, // hashed
  media: [{ type: String }],

  // new deduction fields
  deductionType: { type: String, default: null }, 
  deductionAmount: { type: Number, default: 0 },

  // leave management
  leaveType: { type: String, enum: ["CL", "SL", "PL", "UL"], default: undefined }, 
  leaveApproved: { type: Boolean, default: false },
}, { timestamps: true });

// 🔑 Hash password before saving (only if it’s not already hashed)
employeeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  // prevent double-hashing (bcrypt hashes always start with "$2")
  if (this.password.startsWith("$2")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔑 Compare password
employeeSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Employee", employeeSchema);
