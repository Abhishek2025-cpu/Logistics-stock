const express = require("express");
const Categoryrouter = express.Router();
const {
  addCategroy,
  get__category,
  update__Category,
  delete__Category,
} = require("../controllers/category");

Categoryrouter.post("/category", addCategroy);
Categoryrouter.get("/category", get__category);
Categoryrouter.put("/category/:id", update__Category);
Categoryrouter.delete("/category/:id", delete__Category);

module.exports = Categoryrouter;
