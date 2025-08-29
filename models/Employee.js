const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const employeeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // link to User

  employeeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  number: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  address: { type: String, required: true },
  companyName: { type: String, required: true },
  workingHours: { type: String, required: true },
  workingDays: { type: String, required: true },
  department: { type: String, required: true },
  role: { type: String, required: true },
  salary: { type: Number, required: true },
  leave: { type: Number, default: 0 },
  password: { type: String, required: true },
  media: [{ type: String }],
}, { timestamps: true });

employeeSchema.pre(/^find/, function (next) {
  this.populate("user", "name email number city role department key isActive");
  next();
});


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
