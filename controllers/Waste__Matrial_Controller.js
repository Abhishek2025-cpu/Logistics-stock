const { verifyToken } = require("../middleware/auth");
const CategoryModal = require("../models/Category");
const WasteMaterialModal = require("../models/Waste__Matrial");

const create__WasteMaterial = async (req, res) => {
  try {
    const { wasteName, categoryId, weight, stock, pricePerKg } = req.body;

    const image = req.file?.path;

    verifyToken(req);

    const category = await CategoryModal.findById(categoryId);
    if (!category) {
      return res
        .status(404)
        .json({ status: 404, message: "Category not found" });
    }

    if (await WasteMaterialModal.findOne({ wasteName })) {
      return res
        .status(400)
        .json({ status: 400, message: "Waste Material already exists" });
    }

    const newWaste = await WasteMaterialModal.create({
      wasteName,
      categoryId,
      weight,
      stock,
      pricePerKg,
      image,
    });

    return res.status(201).json({
      status: 201,
      waste: {
        ...newWaste._doc,
        category,
      },
    });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

const get__WasteMaterial = async (req, res) => {
  try {
    verifyToken(req);
    const wasteMaterials = await WasteMaterialModal.find().populate(
      "categoryId"
    );
    return res.status(200).json({ status: 200, wasteMaterials });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

const update__WasteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { wasteName, categoryId, weight, stock, pricePerKg } = req.body;

    const image = req.file?.path;

    verifyToken(req);

    const existingWaste = await WasteMaterialModal.findById(id);
    if (!existingWaste) {
      return res
        .status(404)
        .json({ status: 404, message: "Waste Material not found" });
    }

    const category = await CategoryModal.findById(categoryId);
    if (!category) {
      return res
        .status(404)
        .json({ status: 404, message: "Category not found" });
    }

    if (wasteName) {
      const duplicate = await WasteMaterialModal.findOne({
        wasteName,
        _id: { $ne: id },
      });
      if (duplicate) {
        return res
          .status(400)
          .json({ status: 400, message: "Waste Material already exists" });
      }
    }

    const updatedWaste = await WasteMaterialModal.findByIdAndUpdate(
      id,
      {
        wasteName,
        categoryId,
        weight,
        stock,
        pricePerKg,
        ...(image && { image }),
      },
      { new: true, runValidators: true }
    ).populate("categoryId");

    return res.status(200).json({
      status: 200,
      waste: updatedWaste,
    });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

const delete__WasteMatrial = async (req, res) => {
  try {
    verifyToken(req);

    const { id } = req.params;
    const deletedClient = await WasteMaterialModal.findByIdAndDelete(id);

    if (!deletedClient) {
      return res
        .status(404)
        .json({ status: 404, message: "Waste Material not found" });
    }

    return res
      .status(200)
      .json({ status: 200, message: "Waste Material deleted successfully" });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

const status__Update__WasteMatrial = async (req, res) => {
  try {
    verifyToken(req);

    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "complete"].includes(status)) {
      return res
        .status(400)
        .json({ status: 400, message: "Invalid status value" });
    }

    const existingWaste = await WasteMaterialModal.findById(id);
    if (!existingWaste) {
      return res
        .status(404)
        .json({ status: 404, message: "Waste Material not found" });
    }

    if (existingWaste.status === status) {
      return res.status(400).json({
        status: 400,
        message: `Status is already '${status}'`,
      });
    }

    existingWaste.status = status;
    await existingWaste.save();

    return res.status(200).json({
      status: 200,
      message: "Waste Material status updated successfully",
      waste: existingWaste,
    });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

module.exports = {
  create__WasteMaterial,
  get__WasteMaterial,
  update__WasteMaterial,
  delete__WasteMatrial,
  status__Update__WasteMatrial,
};
