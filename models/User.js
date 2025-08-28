const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    number: { type: String, required: true },
    city: { type: String, required: true },
    // Role is now just a String, no enum, allowing for more flexibility
    role: { type: String, required: true },
    password: { type: String, required: true },
    token: { type: String, default: null },
    tokenExpiry: { type: Date, default: null },
    // Fields for employee status
    isActive: { type: Boolean, default: true },
    activatedAt: { type: Date, default: Date.now }, // Default to now for new active users
    deactivatedAt: { type: Date }, // Will be set when user becomes inactive
  },
  { timestamps: true }
);

// Virtual relation
userSchema.virtual("attendances", {
  ref: "Attendance",
  localField: "_id",
  foreignField: "user",
});
userSchema.set("toObject", { virtuals: true });
userSchema.set("toJSON", { virtuals: true });

// Hash password before save
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) { // Only hash if password is changed/new
    this.password = await bcrypt.hash(this.password, 10);
  }
  // Ensure role is stored in lowercase for consistency
  if (this.isModified("role")) {
    this.role = this.role.toLowerCase();
  }
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);