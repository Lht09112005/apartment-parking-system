const express = require("express");
const router = express.Router();
const { getStats } = require("../controllers/dashboard.controller");
const {
  verifyToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");

router.use(verifyToken);
router.use(authorizeRoles("Admin"));

router.get("/stats", getStats);

module.exports = router;
