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
router.use(authorizeRoles("Super Admin"));

router.get("/", getAllUsers);
router.post("/", createUser);
router.put("/:id", updateUser);
router.put("/:id/reset-password", resetPassword);

module.exports = router;
