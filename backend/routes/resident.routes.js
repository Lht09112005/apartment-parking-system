const express = require("express");
const router = express.Router();
const {
  getAllResidents,
  createResident,
  updateResident,
} = require("../controllers/resident.controller");
const {
  verifyToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");

router.use(verifyToken);
router.use(authorizeRoles("Admin"));

router.get("/", getAllResidents);
router.post("/", createResident);
router.put("/:id", updateResident);

module.exports = router;
