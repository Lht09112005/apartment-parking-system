const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/vehicle.controller");
const { verifyToken, authorizeRoles } = require("../middleware/auth.middleware");

// All vehicle routes require a valid token
router.use(verifyToken);

// Accessible by Admin, Super Admin, and Security
router.get("/", authorizeRoles("Super Admin", "Admin", "Security"), vehicleController.getAllVehicles);
router.get("/types", vehicleController.getVehicleTypes);

// Pending vehicle requests (Admin only)
router.get("/pending", authorizeRoles("Admin"), vehicleController.getPendingVehicles);
router.put("/:plate_number/approve", authorizeRoles("Admin"), vehicleController.approveVehicle);
router.put("/:plate_number/reject", authorizeRoles("Admin"), vehicleController.rejectVehicle);

// CRUD vehicles (Admin only)
router.post("/", authorizeRoles("Admin"), vehicleController.createVehicle);
router.put("/:plate_number", authorizeRoles("Admin"), vehicleController.updateVehicle);
router.delete("/:plate_number", authorizeRoles("Admin"), vehicleController.deleteVehicle);

module.exports = router;
