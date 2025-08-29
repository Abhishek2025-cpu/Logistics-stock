const { verifyToken, verifyAdminHRToken } = require("../middleware/auth");
const ClientModal = require("../models/Clients");
const jwt = require("jsonwebtoken");

const getMidnightExpiry = () => {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);

  // Set to next midnight IST
  istNow.setUTCHours(24, 0, 0, 0);

  // Convert back to UTC timestamp
  return new Date(istNow.getTime() - 5.5 * 60 * 60 * 1000);
};

const generateToken = (id, role, expiryDate) => {
  const expiresIn = Math.floor((expiryDate.getTime() - Date.now()) / 1000); // in seconds
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn });
};

const registerClient = async (req, res) => {
  try {
    verifyToken(req);
    verifyAdminHRToken(req);

    const {
      clientName,
      email,
      phone,
      companyName,
      companyAddress,
      storeLocationName,
      password,
    } = req.body;

    if (await ClientModal.findOne({ email })) {
      return res
        .status(400)
        .json({ status: 400, message: "Client already exists" });
    }

    const client = await ClientModal.create({
      clientName,
      email,
      phone,
      companyName,
      companyAddress,
      storeLocationName,
      password,
    });

    const expiry = getMidnightExpiry();
    const token = generateToken(client._id, "client", expiry);

    return res.status(201).json({
      status: 201,
      message: "Client registered successfully",
      token,
      expiry,
      client,
    });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

const get__Client = async (req, res) => {
  try {
    const Clients = await ClientModal.find();
    return res.status(200).json({ status: 200, Clients });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

const update__Client = async (req, res) => {
  try {
    verifyToken(req);

    const { id } = req.params;
    const updatedClient = await ClientModal.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedClient) {
      return res.status(404).json({ status: 404, message: "Client not found" });
    }

    return res.status(200).json({ status: 200, client: updatedClient });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

const delete__Client = async (req, res) => {
  try {
    verifyToken(req);

    const { id } = req.params;
    const deletedClient = await ClientModal.findByIdAndDelete(id);

    if (!deletedClient) {
      return res.status(404).json({ status: 404, message: "Client not found" });
    }

    return res
      .status(200)
      .json({ status: 200, message: "Client deleted successfully" });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

module.exports = {
  registerClient,
  get__Client,
  update__Client,
  delete__Client,
};
