const express = require("express");
const {
  registerClient,
  get__Client,
  update__Client,
} = require("../controllers/clientsController");
const router = express.Router();

router.get("/clients", get__Client);
router.post("/clients", registerClient);
router.put("/clients/:id", update__Client);

module.exports = router;
