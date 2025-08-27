import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// @desc Register User
export const register = async (req, res) => {
  try {
    const { name, email, number, city, password, role } = req.body;

    if (!name || !email || !number || !city || !password) {
      return res.status(400).json({
        status: 400,
        message: "All fields are required",
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({
        status: 409,
        message: "User already exists",
      });
    }

    const user = await User.create({ name, email, number, city, password, role });
    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      status: 201,
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// @desc Login User
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const token = req.headers["authorization"]; // token from header

    if (!token) {
      return res.status(401).json({
        status: 401,
        message: "Authorization token required",
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          status: 403,
          message: "Invalid or expired token",
        });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          status: 404,
          message: "User not found",
        });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          status: 401,
          message: "Invalid email or password",
        });
      }

      return res.status(200).json({
        status: 200,
        message: "Login successful",
        role: user.role,
        token,
      });
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// @desc Logout User
export const logout = async (req, res) => {
  return res.status(200).json({
    status: 200,
    message: "Logout successful, clear token on client",
  });
};
