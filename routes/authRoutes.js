const express = require("express");
const { register, login, logout,getAllUsers,updateUserDetails, get_Single_Users } = require("../controllers/authController.js");

const router = express.Router();

router.post("/register", register);
router.put("/users/:userId/update", updateUserDetails);

router.post("/login", login);
router.post("/logout", logout);
router.get('/all-emp',getAllUsers);
router.get('/single-emp/:id',get_Single_Users);



module.exports = router;
