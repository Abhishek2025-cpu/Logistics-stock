const { verifyToken } = require("../middleware/auth");
const ClientModal = require("../models/Clients");
const Department__Modal = require("../models/Department");
const Employee = require("../models/Employee");
const vehicle = require("../models/vehicle");

const dashboard__controller = async (req, res) => {
  try {
    verifyToken(req);

    
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

module.exports = { dashboard__controller };
