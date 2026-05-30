const express = require("express");
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead } = require("../controllers/notification.controller");
const { verifyToken } = require("../middleware/auth.middleware"); // Gọi middleware xác thực của bạn

router.use(verifyToken); // Yêu cầu đăng nhập cho mọi route dưới đây

router.get("/", getNotifications);
router.put("/mark-all-read", markAllAsRead);
router.put("/:id/read", markAsRead);

module.exports = router;
