const db = require("../config/db");
// Sử dụng cơ chế SSE có sẵn của bạn thay vì Socket.IO
const { emitChange } = require("../realtime");

const NotificationService = {
  // 1. Gửi thông báo cho 1 người dùng cụ thể
  notifyUser: async (userId, title, content, type) => {
    try {
      const [result] = await db.query(
        `INSERT INTO notifications (user_id, title, content, type, is_read) VALUES (?, ?, ?, ?, false)`,
        [userId, title, content, type]
      );
      
      // Bắn sự kiện realtime xuống Frontend
      emitChange({
        action: "new_notification",
        source: "notification_service",
        resources: [{
          notification_id: result.insertId,
          user_id: userId,
          title,
          content,
          type,
          is_read: 0,
          created_at: new Date().toISOString()
        }]
      });
      console.log(`[Notification] Đã gửi cho user_id ${userId}: ${title}`);
    } catch (err) {
      console.error("Lỗi gửi thông báo cá nhân:", err);
    }
  },

  // 2. Gửi thông báo cho một nhóm quyền
  notifyRole: async (roleIds, title, content, type) => {
    try {
      const [users] = await db.query(`SELECT user_id FROM users WHERE role_id IN (?) AND status = 'active'`, [roleIds]);
      
      for (let user of users) {
        await NotificationService.notifyUser(user.user_id, title, content, type);
      }
      console.log(`[Notification] Đã gửi cho các role ${roleIds.join(',')}: ${title}`);
    } catch (err) {
      console.error("Lỗi gửi thông báo theo quyền:", err);
    }
  }
};

module.exports = NotificationService;