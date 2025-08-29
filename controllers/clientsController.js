const ClientModal = require("../models/Clients");

const registerClient = async (req, res) => {
  try {
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

    return res.status(201).json({
      status: 201,
      message: "Client registered successfully",
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

module.exports = { registerClient, get__Client, update__Client };
