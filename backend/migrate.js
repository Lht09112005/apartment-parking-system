const db = require('./config/db');

async function migrate() {
  try {
    console.log("Bắt đầu di chuyển dữ liệu...");
    
    // Tìm tên Foreign Key
    const [rows] = await db.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = 'parking_session' 
        AND TABLE_SCHEMA = 'parking_db' 
        AND COLUMN_NAME = 'plate_number' 
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    if (rows.length > 0) {
      const fkName = rows[0].CONSTRAINT_NAME;
      console.log(`Tiến hành gỡ khóa ngoại: ${fkName}`);
      await db.query(`ALTER TABLE parking_session DROP FOREIGN KEY ${fkName}`);
    } else {
      console.log("Không tìm thấy khóa ngoại trên cột plate_number, có thể đã được gỡ.");
    }

    console.log("Sao chép dữ liệu từ guest_plate sang plate_number...");
    await db.query(`UPDATE parking_session SET plate_number = guest_plate WHERE plate_number IS NULL`);

    console.log("Cập nhật độ dài cột plate_number thành VARCHAR(20) và xóa guest_plate...");
    await db.query(`ALTER TABLE parking_session MODIFY plate_number VARCHAR(20) NOT NULL`);
    
    // Check if guest_plate column exists before dropping
    const [columns] = await db.query(`SHOW COLUMNS FROM parking_session LIKE 'guest_plate'`);
    if (columns.length > 0) {
      await db.query(`ALTER TABLE parking_session DROP COLUMN guest_plate`);
      console.log("Đã xóa cột guest_plate.");
    }
    
    console.log("=== HOÀN TẤT MIGRATION THÀNH CÔNG ===");
    process.exit(0);
  } catch (error) {
    console.error("LỖI MIGRATION:", error);
    process.exit(1);
  }
}

migrate();
