const { verifyToken, verifyAdminHRToken } = require("../middleware/auth");
const BranchModal = require("../models/Branch");

const create_Branch = async (req, res) => {
  try {
    verifyToken(req);
    verifyAdminHRToken(req);

    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        status: 400,
        message: "Branch name is required",
      });
    }

    const existing = await BranchModal.findOne({ name });
    if (existing) {
      return res.status(409).json({
        status: 409,
        message: "Branch already exists",
      });
    }

    const newBranch = await BranchModal.create({ name });

    return res.status(201).json({
      status: 201,
      message: "Branch created successfully",
      branch: newBranch,
    });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

const get__Branch = async (req, res) => {
  try {
    verifyToken(req);

    const branches = await BranchModal.find().sort({ createdAt: -1 });

    return res.status(200).json({ status: 200, branches });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

const update__Branch = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const existing = await BranchModal.findOne({ name });
    if (existing) {
      return res.status(409).json({
        status: 409,
        message: "Branch name already exists",
      });
    }

    const updatedBranch = await BranchModal.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedBranch) {
      return res.status(404).json({ status: 404, message: "Branch not found" });
    }

    return res.status(200).json({ status: 200, category: updatedBranch });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

const delete__Branch = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedBranch = await BranchModal.findByIdAndDelete(id);

    if (!deletedBranch) {
      return res.status(404).json({ status: 404, message: "Branch not found" });
    }

    return res
      .status(200)
      .json({ status: 200, message: "Branch deleted successfully" });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

module.exports = {
  create_Branch,
  get__Branch,
  update__Branch,
  delete__Branch,
};
