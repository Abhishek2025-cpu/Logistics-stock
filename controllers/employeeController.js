const Employee = require("../models/employee");

// Create Employee
exports.createEmployee = async (req, res) => {
  try {
    const { employeeId, name, number, email, address, companyName, workingHours, workingDays, department, role, salary } = req.body;
    
    const mediaUrls = req.files?.map(file => file.path) || []; // cloudinary gives .path as URL

    const employee = new Employee({
      employeeId,
      name,
      number,
      email,
      address,
      companyName,
      workingHours,
      workingDays,
      department,
      role,
      salary,
      media: mediaUrls
    });

    await employee.save();
    res.status(201).json({ message: "Employee created successfully", employee });
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
