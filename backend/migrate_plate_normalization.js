const db = require('./config/db');

async function migrate() {
  try {
    console.log("Bắt đầu chuẩn hóa biển số xe trong database...");
    
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log("Tắt FOREIGN_KEY_CHECKS...");

    console.log("Chuẩn hóa bảng vehicles...");
    await db.query("UPDATE vehicles SET plate_number = UPPER(REPLACE(REPLACE(REPLACE(plate_number, '-', ''), '.', ''), ' ', ''))");

    console.log("Chuẩn hóa bảng monthly_parking...");
    await db.query("UPDATE monthly_parking SET plate_number = UPPER(REPLACE(REPLACE(REPLACE(plate_number, '-', ''), '.', ''), ' ', ''))");

    console.log("Chuẩn hóa bảng parking_session...");
    await db.query("UPDATE parking_session SET plate_number = UPPER(REPLACE(REPLACE(REPLACE(plate_number, '-', ''), '.', ''), ' ', ''))");

    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log("Bật lại FOREIGN_KEY_CHECKS...");

    console.log("=== HOÀN TẤT CHUẨN HÓA BIỂN SỐ XE THÀNH CÔNG ===");
    process.exit(0);
  } catch (error) {
    console.error("LỖI MIGRATION:", error);
    process.exit(1);
  }
}

migrate();
