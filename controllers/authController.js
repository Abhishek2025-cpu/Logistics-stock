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

// @desc Register User
exports.register = async (req, res) => {
  try {
    const { name, email, number, city, password, role } = req.body;

    if (!name || !email || !number || !city || !password) {
      return res.status(400).json({ status: 400, message: "All fields are required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ status: 409, message: "User already exists" });
    }

    const user = await User.create({ name, email, number, city, password, role });

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
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
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
