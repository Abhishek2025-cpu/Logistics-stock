const express = require("express");
const { register, login, logout,getAllUsers } = require("../controllers/authController.js");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get('/all-emp',getAllUsers);

module.exports = router;
