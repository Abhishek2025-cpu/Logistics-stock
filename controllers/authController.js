import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// @desc Register User
export const register = async (req, res) => {
  try {
    const { name, email, number, city, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ name, email, number, city, password, role });

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Login User
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user._id, user.role);

    res.json({
      message: "Login successful",
      token,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Logout User (clear token on client)
export const logout = async (req, res) => {
  res.json({ message: "Logout successful, clear token on client-side" });
};
