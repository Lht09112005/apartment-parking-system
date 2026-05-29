const cron = require("node-cron");
const db = require("../config/db");
const NotificationService = require("../services/notification.service");

// Cấu hình Cron Job chạy tự động vào lúc 08:00 sáng mỗi ngày
// Cú pháp chuẩn: 'phút giờ ngày_trong_tháng tháng ngày_trong_tuần'
// Mẹo kiểm tra thử nghiệm: Thay bằng '* * * * *' để hệ thống chạy quét mỗi phút một lần
cron.schedule("0 8 * * *", async () => {
  console.log("[Cron Job] Bắt đầu quét hệ thống kiểm tra thời hạn vé gửi xe tháng...");
  
  try {
    // Tìm các vé tháng có trạng thái 'active' và có ngày hết hạn nằm trong khoảng 5 ngày tới
    // CURDATE() lấy ngày hiện tại (YYYY-MM-DD 00:00:00)
    const [expiringTickets] = await db.query(`
      SELECT 
        m.monthly_id,
        m.plate_number, 
        m.end_date, 
        r.user_id
      FROM monthly_parking m
      JOIN vehicles v ON m.plate_number = v.plate_number AND v.status != 'deleted'
      JOIN residents r ON v.resident_id = r.resident_id
      WHERE m.status = 'active' 
        AND m.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 5 DAY)
    `);

    if (expiringTickets.length === 0) {
      console.log("[Cron Job] Hoàn thành quét. Không phát hiện vé tháng nào sắp hết hạn.");
      return;
    }

    console.log(`[Cron Job] Phát hiện ${expiringTickets.length} vé gửi xe sắp hết hạn. Tiến hành tạo thông báo...`);

    for (const ticket of expiringTickets) {
      // Định dạng ngày hết hạn từ database sang kiểu hiển thị Việt Nam (DD/MM/YYYY)
      const endDate = new Date(ticket.end_date);
      const formattedDate = `${String(endDate.getDate()).padStart(2, '0')}/${String(endDate.getMonth() + 1).padStart(2, '0')}/${endDate.getFullYear()}`;

      const title = "Vé tháng sắp hết hạn";
      const content = `Vé tháng của xe biển số ${ticket.plate_number} sẽ hết hạn vào ngày ${formattedDate}. Vui lòng gia hạn sớm.`;
      const type = "TICKET_EXPIRING_WARNING";

      // Gọi service để lưu thông báo vào database của từng cư dân cụ thể
      await NotificationService.notifyUser(ticket.user_id, title, content, type);
    }
    
    console.log("[Cron Job] Đã hoàn tất việc gửi toàn bộ thông báo nhắc nhở gia hạn.");
  } catch (error) {
    console.error("[Cron Job Error] Đã xảy ra lỗi trong quá trình quét dữ liệu vé tháng:", error);
  }
});

module.exports = cron;
