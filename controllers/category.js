const CategoryModal = require("../models/Category");

const addCategroy = async (req, res) => {
  try {
    const { categoryName } = req.body;

    if (await CategoryModal.findOne({ categoryName })) {
      return res
        .status(400)
        .json({ status: 400, message: "Category already exists" });
    }

    const Category = await CategoryModal.create({
      categoryName,
    });

    return res.status(201).json({
      status: 201,
      message: "Category Create successfully",
      Category,
    });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

const get__category = async (req, res) => {
  try {
    const category = await CategoryModal.find();
    return res.status(200).json({ status: 200, category });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

const update__Category = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedCategory = await CategoryModal.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res
        .status(404)
        .json({ status: 404, message: "Category not found" });
    }

    return res.status(200).json({ status: 200, category: updatedCategory });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

const delete__Category = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCategory = await CategoryModal.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res
        .status(404)
        .json({ status: 404, message: "Category not found" });
    }

    return res
      .status(200)
      .json({ status: 200, message: "Category deleted successfully" });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

module.exports = {
  addCategroy,
  get__category,
  update__Category,
  delete__Category,
};
