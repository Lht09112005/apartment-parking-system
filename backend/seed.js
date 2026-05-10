const db = require("./config/db");
const bcrypt = require("bcrypt");

async function seedData() {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const passwordHash = await bcrypt.hash("123456", 10);
    const newApartments = ["A102", "A103", "B101", "B102"];

    for (const apt of newApartments) {
      const username = `resident_${apt.toLowerCase()}`;

      // Check if user already exists
      const [existingUser] = await conn.query(`SELECT user_id FROM users WHERE username = ?`, [username]);
      let userId;

      if (existingUser.length === 0) {
        const [userRes] = await conn.query(
          `INSERT INTO users (username, password, role_id) VALUES (?, ?, 4)`,
          [username, passwordHash]
        );
        userId = userRes.insertId;

        await conn.query(
          `INSERT INTO residents (user_id, name, apartment_number, phone, email) VALUES (?, ?, ?, ?, ?)`,
          [userId, `Chủ hộ ${apt}`, apt, '0987654321', `chuho_${apt.toLowerCase()}@example.com`]
        );
      }
    }

    // Insert 'Xe điện' into vehicle_types
    const [existingType] = await conn.query(`SELECT type_id FROM vehicle_types WHERE type_name = 'Xe điện'`);
    if (existingType.length === 0) {
      // Find max type_id
      const [maxType] = await conn.query(`SELECT MAX(type_id) as max_id FROM vehicle_types`);
      const newTypeId = (maxType[0].max_id || 0) + 1;

      await conn.query(
        `INSERT INTO vehicle_types (type_id, type_name) VALUES (?, ?)`,
        [newTypeId, 'Xe điện']
      );

      // Thêm giá cho Xe điện
      await conn.query(
        `INSERT INTO parking_fee (type_id, price_per_hour, monthly_fee) VALUES (?, 2000.00, 100000.00)`,
        [newTypeId]
      );
    }

    await conn.commit();
    console.log("Seed completed successfully.");
  } catch (err) {
    await conn.rollback();
    console.error("Seed failed:", err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seedData();
