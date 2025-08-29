const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ClientSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    companyName: { type: String, required: true },
    companyAddress: { type: String },
    storeLocationName: { type: String },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

ClientSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

ClientSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const ClientModal = mongoose.model("Client", ClientSchema);

module.exports = ClientModal;
