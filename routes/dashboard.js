const express = require("express");
const { dashboard__controller } = require("../controllers/dashboard");
const dashboardRouter = express.Router();

dashboardRouter.get("/dashboard/admin", dashboard__controller)

module.exports = dashboardRouter;
