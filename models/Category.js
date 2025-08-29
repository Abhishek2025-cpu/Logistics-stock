const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const categorySchema = new mongoose.Schema(
  {
    categoryName: { type: String, required: true },
  },
  { timestamps: true }
);

const CategoryModal = mongoose.model("Category", categorySchema);

module.exports = CategoryModal;
