const express = require("express");
const {
  get__Branch,
  create_Branch,
  update__Branch,
  delete__Branch,
} = require("../controllers/branches");

const branch_Router = express.Router();

branch_Router.get("/branchs", get__Branch);
branch_Router.post("/branchs", create_Branch);
branch_Router.put("/branchs/:id", update__Branch);
branch_Router.delete("/branchs/:id", delete__Branch);

module.exports = branch_Router;
