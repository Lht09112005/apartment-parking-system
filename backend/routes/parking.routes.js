const express = require("express");
const router = express.Router();
const parkingController = require("../controllers/parking.controller");
const { verifyToken, authorizeRoles } = require("../middleware/auth.middleware");

// Security only
router.post("/check-in", verifyToken, authorizeRoles("Security", "Admin", "Super Admin"), parkingController.checkIn);
router.post("/check-out", verifyToken, authorizeRoles("Security", "Admin", "Super Admin"), parkingController.checkOut);
// Security & Admin
router.get("/sessions", verifyToken, authorizeRoles("Security", "Admin", "Super Admin"), parkingController.getAllSessions);
router.get("/fees", verifyToken, authorizeRoles("Security", "Admin", "Super Admin"), parkingController.getFeeConfig);
router.get("/report/summary", verifyToken, authorizeRoles("Security", "Admin", "Super Admin"), parkingController.getFinancialSummary);

// Admin only
router.put("/fees", verifyToken, authorizeRoles("Admin", "Super Admin"), parkingController.updateFeeConfig);
router.get("/monthly", verifyToken, authorizeRoles("Admin", "Super Admin"), parkingController.getMonthlyParking);
router.put("/monthly/:monthly_id", verifyToken, authorizeRoles("Admin", "Super Admin"), parkingController.updateMonthlyStatus);

module.exports = router;
