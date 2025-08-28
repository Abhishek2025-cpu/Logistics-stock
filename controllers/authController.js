const jwt = require("jsonwebtoken");
const User = require("../models/User.js");
const Attendance = require("../models/Attendance");

// Function to calculate expiry at next midnight IST
const getMidnightExpiry = () => {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);

  // Set to next midnight IST
  istNow.setUTCHours(24, 0, 0, 0);

  // Convert back to UTC timestamp
  return new Date(istNow.getTime() - 5.5 * 60 * 60 * 1000);
};

// Generate JWT
const generateToken = (id, role, expiryDate) => {
  const expiresIn = Math.floor((expiryDate.getTime() - Date.now()) / 1000); // in seconds
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn });
};

const verifyAdminHRToken = (req) => {
  const decoded = verifyToken(req);
  const userRole = decoded.role ? decoded.role.toLowerCase() : '';

  if (userRole !== 'admin' && userRole !== 'hr') {
    throw new Error("Unauthorized: Only Admin or HR can perform this action");
  }
  return decoded;
};


const verifyToken = (req) => {
  const token = req.headers["authorization"];
  if (!token) throw new Error("Authorization token required");
  return jwt.verify(token, process.env.JWT_SECRET);
};

// @desc Register User
exports.register = async (req, res) => {
  try {
    const { name, email, number, city, password } = req.body;

    if (!name || !email || !number || !city || !password) {
      return res.status(400).json({ status: 400, message: "All fields are required" });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ status: 409, message: "User already exists" });
    }

    // Create user with default role & department as null, key as null
    const user = await User.create({
      name,
      email,
      number,
      city,
      password,
      role: null,          // default null
      department: null,    // default null
      key: null            // default null (Employee ID will be updated later)
    });

    // Generate token valid till midnight IST
    const expiry = getMidnightExpiry();
    const token = generateToken(user._id, user.role, expiry);

    // Save token & expiry in DB
    user.token = token;
    user.tokenExpiry = expiry;
    await user.save();

    return res.status(201).json({
      status: 201,
      message: "Registration successful",
      token,
      expiry,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        number: user.number,
        city: user.city,
        role: user.role,             // null
        department: user.department, // null
        key: user.key                // null
      },
    });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};


exports.updateUserDetails = async (req, res) => {
  try {
    const decoded = verifyAdminHRToken(req); // Only HR/Admin can update
    const { userId } = req.params;
    const { role, department, key } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }

    // Update only allowed fields
    if (role !== undefined) user.role = role;
    if (department !== undefined) user.department = department;
    if (key !== undefined) user.key = key;

    await user.save();

    return res.status(200).json({
      status: 200,
      message: "User details updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        number: user.number,
        city: user.city,
        role: user.role,
        department: user.department,
        key: user.key,
      },
    });
  } catch (error) {
    console.error("updateUserDetails Error:", error);
    return res.status(error.message.includes("Unauthorized") ? 403 : 500).json({
      status: error.message.includes("Unauthorized") ? 403 : 500,
      message: error.message,
    });
  }
};


// @desc Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ status: 400, message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ status: 401, message: "Invalid email or password" });
    }

    let token = user.token;
    let expiry = user.tokenExpiry;

    // Check if existing token is expired
    if (!token || !expiry || new Date(expiry) <= new Date()) {
      expiry = getMidnightExpiry();
      token = generateToken(user._id, user.role, expiry);

      user.token = token;
      user.tokenExpiry = expiry;
      await user.save();
    }

    return res.status(200).json({
      status: 200,
      message: "Login successful",
      role: user.role,
      userId: user._id,
      token,
      expiry,
    });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

// @desc Logout User
exports.logout = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (user) {
      user.token = null;
      user.tokenExpiry = null;
      await user.save();
    }

    return res.status(200).json({
      status: 200,
      message: "Logout successful, token cleared",
    });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};




// @desc Get all users with attendance
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate("attendances") // populate attendance for each user
      .select("-password");   // hide password field

    return res.status(200).json({
      status: 200,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};
