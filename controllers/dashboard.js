const { verifyToken } = require("../middleware/auth");
const ClientModal = require("../models/Clients");
const Department__Modal = require("../models/Department");
const Employee = require("../models/Employee");

const dashboard__controller = async (req, res) => {
  try {
    verifyToken(req);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const total_Clients = await ClientModal.countDocuments();
    const total_Employees = await Employee.countDocuments();
    const total_Department = await Department__Modal.countDocuments();

    const new_Clients = await ClientModal.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const today_Clients = await ClientModal.countDocuments({
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    });

    const new_Employees = await Employee.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const today_Employees = await Employee.countDocuments({
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    });

    return res.status(200).json({
      status: 200,
      message: "Dashboard data",
      total: {
        total_Clients,
        total_Employees,
        total_Department,
      },
      today: {
        today_Clients,
        today_Employees,
      },
      latest: {
        new_Clients,
        new_Employees,
      },
    });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

module.exports = { dashboard__controller };
