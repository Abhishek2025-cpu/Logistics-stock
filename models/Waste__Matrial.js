const mongoose = require("mongoose");

const WasteMaterialSchema = new mongoose.Schema(
  {
    wasteName: { type: String, required: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    weight: { type: Number, required: true },
    stock: { type: Number, required: true },
    pricePerKg: { type: Number, required: true },
    image: { type: String, required: true },
  },
  { timestamps: true }
);

const WasteMaterialModal = mongoose.model("WasteMaterial", WasteMaterialSchema);
module.exports = WasteMaterialModal;
