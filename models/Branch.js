const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
  },
  { timestamps: true }
);

const BranchModal = mongoose.model("Branch", branchSchema);
module.exports = BranchModal;
