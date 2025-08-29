const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const jwt = require("jsonwebtoken");


// Common JWT generator
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// UNIVERSAL LOGIN: works for both Employee & User
exports.universalLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body; 
    // identifier = email OR number

    let account = null;
    let role = null;

    // 1️⃣ Try finding in Employee collection
    account = await Employee.findOne({
      $or: [{ email: identifier }, { number: identifier }]
    });

    if (account) {
      const isMatch = await account.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      role = "employee";
    } else {
      // 2️⃣ Try finding in User collection
      account = await User.findOne({
        $or: [{ email: identifier }, { number: identifier }]
      });

      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }

      const isMatch = await account.matchPassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      role = account.role || "user";
    }

    // 3️⃣ Generate a single token format for both
    const token = generateToken(account._id, role);

    return res.status(200).json({
      message: "Login successful",
      role,
      account,
      token
    });
  } catch (error) {
    console.error("Universal login error:", error);
    return res.status(500).json({ error: error.message });
  }
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

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

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
    const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

    const result = [];

    for (const emp of employees) {
      // find today's attendance
      const attendance = await Attendance.findOne({
        employee: emp._id,
        date: todayStr
      });

      let status = "A"; // default Absent

      if (attendance) {
        if (attendance.punchIn && attendance.punchOut) {
          status = "P"; // Full day Present
        } else if (attendance.punchIn && !attendance.punchOut) {
          status = "HD"; // Half Day
        }
      }

      result.push({
        _id: emp._id,
        employeeId: emp.employeeId,
        name: emp.name,
        number: emp.number,
        email: emp.email,
        department: emp.department,
        role: emp.role,
        salary: emp.salary,
        workingHours: emp.workingHours,
        workingDays: emp.workingDays,
        leave: emp.leave,
        warnings: emp.warnings || 0,

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
