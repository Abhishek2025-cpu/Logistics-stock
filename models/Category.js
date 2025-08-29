const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const employeeSchema = new mongoose.Schema(
  {
    categoryName: { type: String, required: true },
  },
  { timestamps: true }
);

const CategoryModal = mongoose.model("Category", employeeSchema);

module.exports = CategoryModal;
