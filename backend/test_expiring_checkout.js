const db = require("./config/db");

async function run() {
  console.log("=== BẮT ĐẦU TẠO DỮ LIỆU TEST XE VÀO CÒN HẠN - RA HẾT HẠN ===");
  try {
    const plate = "29A12345";

    // 1. Đồng bộ trạng thái xe hoạt động
    await db.query(
      `UPDATE vehicles SET status = 'active' WHERE plate_number = ?`,
      [plate]
    );

    // 2. Xóa các phiên gửi xe cũ của biển số này để tránh xung đột
    await db.query(
      `DELETE FROM parking_session WHERE plate_number = ?`,
      [plate]
    );
    console.log("1. Đã dọn dẹp các phiên đỗ cũ của xe 29A12345.");

    // 3. Tạo vé tháng có hạn kết thúc vào HÔM QUA (đã hết hạn ở thời điểm hiện tại, nhưng còn hạn cách đây 2 ngày)
    // start_date = 30 ngày trước
    // end_date = 1 ngày trước (hết hạn ngày hôm qua)
    await db.query(
      `UPDATE monthly_parking 
       SET start_date = DATE_SUB(CURDATE(), INTERVAL 30 DAY),
           end_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY),
           status = 'active'
       WHERE plate_number = ?`,
      [plate]
    );
    console.log("2. Đã đặt hạn vé tháng của xe 29A12345: Từ 30 ngày trước -> Hết hạn vào ngày HÔM QUA.");

    // 4. Tạo một phiên gửi xe mới (đang trong bãi) có giờ vào là 2 ngày trước
    // Lúc vào (2 ngày trước) -> Vé tháng vẫn còn hạn
    // Lúc ra (Hôm nay) -> Vé tháng đã hết hạn
    const timeIn = new Date();
    timeIn.setDate(timeIn.getDate() - 2); // 2 ngày trước
    timeIn.setHours(8, 0, 0, 0); // 08:00 sáng

    await db.query(
      `INSERT INTO parking_session (plate_number, staff_id, time_in, time_out, status, fee_amount, type_id) 
       VALUES (?, ?, ?, NULL, 'parking', 0, 1)`,
      [plate, 2, timeIn] // type_id = 1 (Xe máy), staff_id = 2 (nhân viên bảo vệ)
    );
    console.log(`3. Đã tạo phiên gửi xe đang trong bãi: Giờ vào lúc ${timeIn.toLocaleString('vi-VN')} (khi đó vé tháng vẫn còn hạn).`);

    console.log("\n=== TẠO DỮ LIỆU THÀNH CÔNG ===");
    console.log("👉 Hướng dẫn test:");
    console.log("1. Đăng nhập tài khoản Bảo vệ (security / 123456).");
    console.log("2. Ở mục 'Ghi nhận xe', chọn chế độ 'XE RA (CHECK-OUT)' và gõ biển số '29A12345'.");
    console.log("3. Kết quả mong đợi:");
    console.log("   - Giao diện bên phải sẽ nhận diện xe cư dân Trần Văn An (Căn hộ A101) nhưng sẽ hiển thị là 'Vé lượt' và hiển thị số tiền tạm tính đỗ 2 ngày (48 giờ) do vé tháng đã hết hạn hôm qua.");
    console.log("   - Nhấn 'CHO RA (EXIT)' -> hệ thống sẽ tính phí gửi xe theo giờ bình thường của cư dân không có vé tháng.");
    console.log("4. Đăng nhập tài khoản Cư dân (resident / 123456):");
    console.log("   - Xem trong lịch sử gửi xe sẽ thấy trạng thái phiên và chi tiết số tiền bị thu.");
    
    process.exit(0);
  } catch (error) {
    console.error("Lỗi khi thực hiện tạo dữ liệu:", error);
    process.exit(1);
  }
}

run();
