const express = require("express");
const {
  get__WasteMaterial,
  create__WasteMaterial,
  update__WasteMaterial,
  delete__WasteMatrial,
  status__Update__WasteMatrial,
} = require("../controllers/Waste__Matrial_Controller");

const upload = require("../middleware/uploadProfile");

const waste_Matrial_Router = express.Router();

waste_Matrial_Router.get("/waste_matrial", get__WasteMaterial);
waste_Matrial_Router.post(
  "/waste_matrial",
  upload.single("image"),
  create__WasteMaterial
);
waste_Matrial_Router.put(
  "/waste_matrial/:id",
  upload.single("image"),
  update__WasteMaterial
);
waste_Matrial_Router.delete("/waste_matrial/:id", delete__WasteMatrial);
waste_Matrial_Router.patch(
  "/waste_matrial/status/:id",
  status__Update__WasteMatrial
);

module.exports = waste_Matrial_Router;
