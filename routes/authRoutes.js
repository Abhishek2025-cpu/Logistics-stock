const express = require("express");
const { register, login, logout,getAllUsers,updateUserDetails } = require("../controllers/authController.js");

const router = express.Router();

router.post("/register", register);
router.put("/users/:userId/update", updateUserDetails);

router.post("/login", login);
router.post("/logout", logout);
router.get('/all-emp',getAllUsers);

module.exports = router;
