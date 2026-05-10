const express = require("express");
const router = express.Router();
const parkingController = require("../controllers/parking.controller");
const { verifyToken, authorizeRoles } = require("../middleware/auth.middleware");

// Security only
router.post("/check-in", verifyToken, authorizeRoles("Security", "Admin", "Super Admin"), parkingController.checkIn);
router.post("/check-out", verifyToken, authorizeRoles("Security", "Admin", "Super Admin"), parkingController.checkOut);
router.get("/sessions", verifyToken, authorizeRoles("Security", "Admin", "Super Admin"), parkingController.getAllSessions);
router.get("/fees", verifyToken, authorizeRoles("Security", "Admin", "Super Admin"), parkingController.getFeeConfig);
router.get("/report/summary", verifyToken, authorizeRoles("Security", "Admin", "Super Admin"), parkingController.getFinancialSummary);

module.exports = router;
