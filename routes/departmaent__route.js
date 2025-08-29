const express = require("express");
const {
  create__Department,
  get__department,
  update__Department,
  delete__Department,
} = require("../controllers/department__Controller");
const departmentRouter = express.Router();

departmentRouter.post("/departments", create__Department);
departmentRouter.get("/departments", get__department);
departmentRouter.put("/departments/:id", update__Department);
departmentRouter.delete("/departments/:id", delete__Department);

module.exports = departmentRouter;
