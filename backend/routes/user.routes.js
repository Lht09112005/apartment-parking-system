const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  createUser,
  updateUser,
  resetPassword,
} = require("../controllers/user.controller");
const {
  verifyToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");

router.use(verifyToken);

router.get("/", authorizeRoles("Super Admin", "Admin"), getAllUsers);
router.post("/", authorizeRoles("Super Admin", "Admin"), createUser);
router.put("/:id", authorizeRoles("Super Admin", "Admin"), updateUser);
router.put("/:id/reset-password", authorizeRoles("Super Admin", "Admin"), resetPassword);

module.exports = router;
