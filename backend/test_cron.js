const db = require("./config/db");
const NotificationService = require("./services/notification.service");

async function run() {
  console.log("=== BẮT ĐẦU TẠO DỮ LIỆU TEST VÉ THÁNG SẮP HẾT HẠN ===");
  try {
    // 1. Gia hạn ngày hết hạn của xe '29A12345' sang CURDATE() + 3 ngày (trong khoảng 5 ngày để nhận cảnh báo)
    const [updateRes] = await db.query(
      `UPDATE monthly_parking 
       SET end_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY), status = 'active'
       WHERE plate_number = '29A12345'`
    );
    console.log("1. Đã cập nhật vé tháng của xe 29A12345 hết hạn sau 3 ngày nữa.");

    // 2. Chạy logic quét vé sắp hết hạn (tương tự cron job)
    console.log("2. Bắt đầu quét hệ thống tìm vé sắp hết hạn...");
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

    console.log(`- Tìm thấy ${expiringTickets.length} vé sắp hết hạn.`);

    for (const ticket of expiringTickets) {
      const endDate = new Date(ticket.end_date);
      const formattedDate = `${String(endDate.getDate()).padStart(2, '0')}/${String(endDate.getMonth() + 1).padStart(2, '0')}/${endDate.getFullYear()}`;

      const title = "Vé tháng sắp hết hạn";
      const content = `Vé tháng của xe biển số ${ticket.plate_number} sẽ hết hạn vào ngày ${formattedDate}. Vui lòng gia hạn sớm.`;
      const type = "TICKET_EXPIRING_WARNING";

      console.log(`- Gửi thông báo cho user_id: ${ticket.user_id} (${ticket.plate_number})`);
      await NotificationService.notifyUser(ticket.user_id, title, content, type);
    }

    // 3. Kiểm tra lại bảng thông báo xem đã có thông báo chưa
    const [notifications] = await db.query(
      `SELECT * FROM notifications ORDER BY created_at DESC LIMIT 3`
    );
    console.log("3. Danh sách thông báo mới nhất trong DB:");
    console.log(notifications);

    console.log("=== TẠO DỮ LIỆU VÀ GỬI THÔNG BÁO TEST THÀNH CÔNG ===");
    process.exit(0);
  } catch (error) {
    console.error("Lỗi khi thực hiện:", error);
    process.exit(1);
  }
}

run();
