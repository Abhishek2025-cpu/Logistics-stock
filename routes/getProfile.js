const express = require("express");
const { dashboard__controller } = require("../controllers/dashboard");
const profileRouter = express.Router();

profileRouter.get("/profile", dashboard__controller);

module.exports = profileRouter;
