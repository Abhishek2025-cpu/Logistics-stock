const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    doj: { type: Date, required: true }, // Date of Joining
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    role: { type: String, required: true }, // employee role
    assignedVehicles: [{ type: String }], // list of vehicle IDs or names
    salary: { type: Number, required: true },
    password: { type: String, required: true },
    profilePic: { type: String }, // cloudinary URL
    isActive: { type: Boolean, default: true },
    token: { type: String, default: null },
    tokenExpiry: { type: Date, default: null },
  },
  { timestamps: true }
);

// Hash password before save
employeeSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Compare password
employeeSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Employee", employeeSchema);
