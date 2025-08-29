const { verifyToken, verifyAdminHRToken } = require("../middleware/auth");
const Department__Modal = require("../models/Department");

const create__Department = async (req, res) => {
  try {
    verifyToken(req);
    verifyAdminHRToken(req);

    const { Name } = req.body;

    if (!Name || Name.trim() === "") {
      return res.status(400).json({
        status: 400,
        message: "Department name is required",
      });
    }

    const existing = await Department__Modal.findOne({ Name });
    if (existing) {
      return res.status(409).json({
        status: 409,
        message: "Department already exists",
      });
    }

    const department = await Department__Modal.create({ Name });

    return res.status(201).json({
      status: 201,
      message: "Department created successfully",
      Department: department,
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        status: 401,
        message: "Invalid or missing token",
      });
    }

    if (error.message === "Forbidden") {
      return res.status(403).json({
        status: 403,
        message: "You are not allowed to perform this action",
      });
    }

    return res.status(500).json({
      status: 500,
      message: error.message || "Internal Server Error",
    });
  }
};

const get__department = async (req, res) => {
  try {
    verifyToken(req);

    const departments = await Department__Modal.find().sort({ createdAt: -1 });

    if (!departments) {
      return res.status(404).json({
        status: 404,
        message: "No departments found",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Departments fetched successfully",
      departments,
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        status: 401,
        message: "Invalid or missing token",
      });
    }

    if (error.message === "Forbidden") {
      return res.status(403).json({
        status: 403,
        message: "You are not allowed to perform this action",
      });
    }

    if (
      error.code === "ENOTFOUND" ||
      error.code === "ECONNREFUSED" ||
      error.code === "ETIMEDOUT" ||
      error.name === "MongoNetworkError"
    ) {
      return res.status(503).json({
        status: 503,
        message: "Network error, please try again later",
      });
    }

    return res.status(500).json({
      status: 500,
      message: error.message || "Internal Server Error",
    });
  }
};

const update__Department = async (req, res) => {
  try {
    verifyToken(req);

    const { id } = req.params;

    const { Name } = req.body;

    if (!Name || Name.trim() === "") {
      return res.status(400).json({
        status: 400,
        message: "Department name is required",
      });
    }

    const existing = await Department__Modal.findById(id);
    if (!existing) {
      return res.status(404).json({
        status: 404,
        message: "Department not found",
      });
    }
    if (existing.Name === Name) {
      return res.status(400).json({
        status: 400,
        message: `Department name is already '${Name}'`,
      });
    }

    const department = await Department__Modal.findByIdAndUpdate(
      id,
      { Name },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      status: 200,
      message: "Department updated successfully",
      Department: department,
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        status: 401,
        message: "Invalid or missing token",
      });
    }

    if (error.message === "Forbidden") {
      return res.status(403).json({
        status: 403,
        message: "You are not allowed to perform this action",
      });
    }

    return res.status(500).json({
      status: 500,
      message: error.message || "Internal Server Error",
    });
  }
};

const delete__Department = async (req, res) => {
  try {
    verifyToken(req);

    const { id } = req.params;
    const deletedDepartment = await Department__Modal.findByIdAndDelete(id);

    if (!deletedDepartment) {
      return res.status(404).json({
        status: 404,
        message: "Department not found",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Department deleted successfully",
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        status: 401,
        message: "Invalid or missing token",
      });
    }

    if (error.message === "Forbidden") {
      return res.status(403).json({
        status: 403,
        message: "You are not allowed to perform this action",
      });
    }

    return res.status(500).json({
      status: 500,
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  create__Department,
  get__department,
  update__Department,
  delete__Department,
};
