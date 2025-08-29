const Employee = require("../models/Employee");
const jwt = require("jsonwebtoken");

// helper: generate JWT
const generateToken = (employee) => {
  return jwt.sign(
    { id: employee._id, role: "employee" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Create Employee (by Admin/HR)
exports.createEmployee = async (req, res) => {
  try {
    const {
      employeeId, name, number, email, address,
      companyName, workingHours, workingDays,
      department, role, salary, leave, password
    } = req.body;

    const mediaUrls = req.files?.map(file => file.path) || [];

    const employee = new Employee({
      employeeId, name, number, email, address,
      companyName, workingHours, workingDays,
      department, role, salary, leave,
      password, 
      media: mediaUrls
    });

    await employee.save();

    const token = generateToken(employee);

    res.status(201).json({
      message: "Employee registered successfully",
      employee,
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Employee Login
exports.loginEmployee = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = number OR email

    const employee = await Employee.findOne({
      $or: [{ number: identifier }, { email: identifier }]
    });

    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const isMatch = await employee.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(employee);

    res.json({
      message: "Login successful",
      employee,
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get All Employees
exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Single Employee
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Employee
exports.updateEmployee = async (req, res) => {
  try {
    const mediaUrls = req.files?.map(file => file.path) || [];
    
    const updatedData = { ...req.body };
    if (mediaUrls.length > 0) updatedData.media = mediaUrls;

    const employee = await Employee.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    res.json({ message: "Employee updated successfully", employee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Employee
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
