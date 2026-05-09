const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/vehicle.controller");

router.get("/", vehicleController.getAllVehicles);
router.post("/", vehicleController.createVehicle);
router.put("/:plate_number", vehicleController.updateVehicle);
router.delete("/:plate_number", vehicleController.deleteVehicle);
router.get("/types", vehicleController.getVehicleTypes);

module.exports = router;
