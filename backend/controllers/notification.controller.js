const db = require("../config/db");

// Lấy danh sách thông báo của user đang đăng nhập
const getNotifications = async (req, res) => {
  try {
    // Lấy user_id từ token thông qua middleware xác thực (auth middleware)
    const userId = req.user.user_id;
    
    // Lấy 50 thông báo gần nhất để tối ưu hiệu suất, sắp xếp mới nhất lên đầu
    const [notifications] = await db.query(
      `SELECT notification_id, title, content, type, is_read, created_at 
       FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );

    // Đếm số lượng thông báo chưa đọc
    const [[{ unread_count }]] = await db.query(
      `SELECT COUNT(*) as unread_count 
       FROM notifications 
       WHERE user_id = ? AND is_read = false`,
      [userId]
    );

    res.json({
      unread_count: unread_count || 0,
      notifications: notifications
    });
  } catch (err) {
    console.error("Lỗi lấy danh sách thông báo:", err);
    res.status(500).json({ message: "Lỗi server khi lấy thông báo" });
  }
};

// Đánh dấu 1 thông báo cụ thể là đã đọc
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    // Phải kiểm tra user_id để đảm bảo người dùng chỉ được sửa thông báo của chính họ
    const [result] = await db.query(
      `UPDATE notifications SET is_read = true WHERE notification_id = ? AND user_id = ?`,
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy thông báo hoặc bạn không có quyền truy cập" });
    }

    res.json({ message: "Đã đánh dấu là đã đọc" });
  } catch (err) {
    console.error("Lỗi cập nhật trạng thái thông báo:", err);
    res.status(500).json({ message: "Lỗi server khi cập nhật thông báo" });
  }
};

// Đánh dấu toàn bộ thông báo của user là đã đọc
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.user_id;

    await db.query(
      `UPDATE notifications SET is_read = true WHERE user_id = ? AND is_read = false`,
      [userId]
    );

    res.json({ message: "Đã đánh dấu tất cả là đã đọc" });
  } catch (err) {
    console.error("Lỗi cập nhật tất cả thông báo:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = { 
  getNotifications, 
  markAsRead, 
  markAllAsRead 
};
