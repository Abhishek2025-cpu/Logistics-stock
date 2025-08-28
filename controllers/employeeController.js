const Employee = require("../models/Employee");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


// Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "24h", // refresh every 24 hours
  });
};
const verifyToken = (req) => {
  const token = req.headers["authorization"];
  if (!token) throw new Error("Authorization token required");
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Helper function to verify Admin or HR token, case-insensitive
const verifyAdminHRToken = (req) => {
  const decoded = verifyToken(req);
  const userRole = decoded.role ? decoded.role.toLowerCase() : '';

  if (userRole !== 'admin' && userRole !== 'hr') {
    throw new Error("Unauthorized: Only Admin or HR can perform this action");
  }
  return decoded;
};
// 📌 Register Employee (Admin/HR only)
exports.registerEmployee = async (req, res) => {
  try {
    verifyAdminHRToken(req); // only HR/Admin

    const { employeeId, name, doj, email, phone, role, assignedVehicles, salary, password } = req.body;

    if (await Employee.findOne({ email })) {
      return res.status(400).json({ status: 400, message: "Employee already exists" });
    }

    const profilePic = req.file ? req.file.path : null; // Cloudinary URL

    const employee = await Employee.create({
      employeeId,
      name,
      doj,
      email,
      phone,
      role,
      assignedVehicles,
      salary,
      password,
      profilePic,
    });

    return res.status(201).json({
      status: 201,
      message: "Employee registered successfully",
      employee,
    });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

// 📌 Employee Sign In
exports.employeeSignIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    const employee = await Employee.findOne({ email });

    if (!employee || !(await employee.matchPassword(password))) {
      return res.status(401).json({ status: 401, message: "Invalid email or password" });
    }

    const token = generateToken(employee._id, "employee");
    employee.token = token;
    employee.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    await employee.save();

    return res.status(200).json({
      status: 200,
      message: "Login successful",
      token,
      employee: {
        _id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        profilePic: employee.profilePic,
      },
    });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

// 📌 Get All Employees (Admin/HR only)
exports.getAllEmployees = async (req, res) => {
  try {
    verifyAdminHRToken(req);
    const employees = await Employee.find();
    return res.status(200).json({ status: 200, employees });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

// 📌 Update Employee (Admin/HR only)
exports.updateEmployee = async (req, res) => {
  try {
    verifyAdminHRToken(req);
    const { employeeId } = req.params;

    const updates = { ...req.body };
    if (req.file) updates.profilePic = req.file.path; // update pic if new uploaded

    const employee = await Employee.findOneAndUpdate({ employeeId }, updates, { new: true });

    if (!employee) return res.status(404).json({ status: 404, message: "Employee not found" });

    return res.status(200).json({ status: 200, message: "Employee updated", employee });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

// 📌 Delete Employee (Admin/HR only)
exports.deleteEmployee = async (req, res) => {
  try {
    verifyAdminHRToken(req);
    const { employeeId } = req.params;
    const employee = await Employee.findOneAndDelete({ employeeId });

    if (!employee) return res.status(404).json({ status: 404, message: "Employee not found" });

    return res.status(200).json({ status: 200, message: "Employee deleted successfully" });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

// 📌 Activate/Deactivate Employee
exports.toggleEmployeeStatus = async (req, res) => {
  try {
    verifyAdminHRToken(req);
    const { employeeId } = req.params;
    const employee = await Employee.findOne({ employeeId });

    if (!employee) return res.status(404).json({ status: 404, message: "Employee not found" });

    employee.isActive = !employee.isActive;
    await employee.save();

    return res.status(200).json({
      status: 200,
      message: `Employee is now ${employee.isActive ? "active" : "inactive"}`,
      employee,
    });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};
