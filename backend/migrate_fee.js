const mysql = require("mysql2/promise");
require("dotenv").config({ path: "../backend/.env" });

async function migrateFee() {
  const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "123456",
    database: "parking_db",
  });

  try {
    console.log("Starting fee migration...");

    // 1. Add new columns
    await db.query(`ALTER TABLE parking_fee ADD COLUMN block_hours INT DEFAULT 4`);
    await db.query(`ALTER TABLE parking_fee ADD COLUMN day_block_price DECIMAL(12, 2)`);
    await db.query(`ALTER TABLE parking_fee ADD COLUMN night_block_price DECIMAL(12, 2)`);
    console.log("Added new columns.");

    // 2. Set prices for Motorbike (type_id = 1)
    await db.query(`
      UPDATE parking_fee 
      SET monthly_fee = 150000, block_hours = 4, day_block_price = 4000, night_block_price = 5000 
      WHERE type_id = 1
    `);
    console.log("Updated Motorbike prices.");

    // 3. Set prices for Car (type_id = 2)
    await db.query(`
      UPDATE parking_fee 
      SET monthly_fee = 1500000, block_hours = 4, day_block_price = 35000, night_block_price = 35000 
      WHERE type_id = 2
    `);
    console.log("Updated Car prices.");

    // 4. Drop old column
    await db.query(`ALTER TABLE parking_fee DROP COLUMN price_per_hour`);
    console.log("Dropped old price_per_hour column.");

    console.log("Fee migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await db.end();
  }
}

migrateFee();
