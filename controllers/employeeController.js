const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
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

    // 🔍 Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { number }] });

    if (!user) {
      // create user if not exists
      user = new User({
        name,
        email,
        number,
        city: address, // mapping address to city if needed
        password,
        role,
        department,
        key: employeeId,
        basePay: salary
      });
      await user.save();
    }

    // Create employee linked to this user
    const employee = new Employee({
      user: user._id, // 🔗 linking user
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
      leave,
      password,
      media: mediaUrls
    });

    await employee.save();

    const token = generateToken(employee);

    res.status(201).json({
      message: "Employee registered successfully",
      employee,
      user, // show linked user info too
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

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const result = [];

    for (const emp of employees) {
      const attendance = await Attendance.findOne({
        employee: emp._id,
        date: todayStr
      });

      let status = "A"; // default Absent
      if (attendance) {
        if (attendance.punchIn && attendance.punchOut) status = "P";
        else if (attendance.punchIn && !attendance.punchOut) status = "HD";
      }

      result.push({
        _id: emp._id,
        employeeId: emp.employeeId,
        name: emp.name,
        number: emp.number,
        email: emp.email,
        address: emp.address,
        companyName: emp.companyName,
        workingHours: emp.workingHours,
        workingDays: emp.workingDays,
        department: emp.department,
        role: emp.role,
        salary: emp.salary,
        leave: emp.leave,
        warnings: emp.warnings || 0,

        // 🔹 Media (Cloudinary URLs saved at creation)
        media: emp.media || [],

        // Attendance details
        attendance: attendance
          ? {
              date: attendance.date,
              punchIn: attendance.punchIn,
              punchOut: attendance.punchOut,
              punchInSelfie: attendance.punchInSelfie,
              punchOutSelfie: attendance.punchOutSelfie,
              status
            }
          : {
              date: todayStr,
              status
            }
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get Single Employee
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const attendance = await Attendance.find({ employee: employee._id });
    const warningCount = attendance.reduce((sum, a) => sum + a.warnings, 0);

    res.json({
      ...employee.toObject(),
      attendance,
      warnings: warningCount,
      payrollAffected: warningCount > 2 // example rule
    });
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
