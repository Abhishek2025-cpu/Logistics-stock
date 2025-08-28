const jwt = require("jsonwebtoken");

exports.verifyToken = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw new Error("Unauthorized: Token missing");
  return jwt.verify(token, process.env.JWT_SECRET);
};

exports.verifyAdminHRToken = (req) => {
  const decoded = this.verifyToken(req);
  const role = decoded.role?.toLowerCase();
  if (role !== "admin" && role !== "hr") {
    throw new Error("Unauthorized: Only Admin or HR allowed");
  }
  return decoded;
};
