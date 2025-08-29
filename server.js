const express = require("express");
const dotenv = require("dotenv");
require("dotenv").config();

const connectDB = require("./config/db");

const path = require("path");
const fs = require("fs");

const cors = require("cors");
dotenv.config();
const app = express();
const authRoutes = require("./routes/authRoutes.js");
const hrmsRoutes = require("./routes/hrmsRoutes");
const payrollRoutes = require("./routes/payrollRoutes");
const EmployeeRoutes = require("./routes/employeeRoutes");
const clientsRoutes = require("./routes/clients");
<<<<<<< HEAD
const Categoryrouter = require("./routes/categoris.js");
=======
const vehiclesRoutes = require("./routes/vehiclesroutes");
>>>>>>> 7fe7bced2be61a5041ec59bbd784419475969f44

// Middleware
app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ limit: "200mb", extended: true }));

// Connect to MongoDB
connectDB();

// Default route
app.get("/", (req, res) => res.send("API is running..."));
app.use("/api/auth", authRoutes);
app.use("/api/hrms", hrmsRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/employee", EmployeeRoutes);
app.use("/api/vehicles", vehiclesRoutes);

app.use("/api", clientsRoutes);
app.use("/api", Categoryrouter);
// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
