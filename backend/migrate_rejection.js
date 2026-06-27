const db = require('./config/db');

async function migrate() {
  try {
    // Kiểm tra cột đã tồn tại chưa
    const [cols] = await db.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'vehicles' 
        AND COLUMN_NAME = 'rejection_reason'
    `);

    if (cols.length > 0) {
      console.log('Cột rejection_reason đã tồn tại, bỏ qua.');
    } else {
      console.log('Đang thêm cột rejection_reason vào bảng vehicles...');
      await db.query(`ALTER TABLE vehicles ADD COLUMN rejection_reason VARCHAR(255) DEFAULT NULL`);
      console.log('✓ Thêm cột thành công!');
    }

    console.log('=== Migration hoàn thành ===');
    process.exit(0);
  } catch (err) {
    console.error('Migration thất bại:', err);
    process.exit(1);
  }
}

migrate();
