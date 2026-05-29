// services/notification.service.js
const db = require("../config/db");
// Tạm thời comment dòng realtime lại cho đến khi bạn tích hợp Socket.IO
// const realtime = require("../realtime"); 

const NotificationService = {
  // 1. Gửi thông báo cho 1 người dùng cụ thể (VD: Cư dân nhận kết quả duyệt)
  notifyUser: async (userId, title, content, type) => {
    try {
      await db.query(
        `INSERT INTO notifications (user_id, title, content, type, is_read) VALUES (?, ?, ?, ?, false)`,
        [userId, title, content, type]
      );
      
      // realtime.getIO().to(`user_${userId}`).emit('new_notification', { title, content, type });
      console.log(`[Notification] Đã gửi cho user_id ${userId}: ${title}`);
    } catch (err) {
      console.error("Lỗi gửi thông báo cá nhân:", err);
    }
  },

  // 2. Gửi thông báo cho một nhóm quyền (VD: Tất cả Admin, hoặc tất cả Bảo vệ)
  notifyRole: async (roleIds, title, content, type) => {
    try {
      const [users] = await db.query(`SELECT user_id FROM users WHERE role_id IN (?) AND status = 'active'`, [roleIds]);
      
      for (let user of users) {
        await db.query(
          `INSERT INTO notifications (user_id, title, content, type, is_read) VALUES (?, ?, ?, ?, false)`,
          [user.user_id, title, content, type]
        );
        // realtime.getIO().to(`user_${user.user_id}`).emit('new_notification', { title, content, type });
      }
      console.log(`[Notification] Đã gửi cho các role ${roleIds.join(',')}: ${title}`);
    } catch (err) {
      console.error("Lỗi gửi thông báo theo quyền:", err);
    }
  }
};

module.exports = NotificationService;
