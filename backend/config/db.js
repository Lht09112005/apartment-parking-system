const mysql2 = require("mysql2");
require("dotenv").config();

const isCloud = process.env.DB_HOST && process.env.DB_HOST !== 'localhost';

const pool = mysql2.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'parking_db',
  waitForConnections: true,
  connectionLimit: 10,
  ssl: isCloud ? { rejectUnauthorized: true } : undefined,
});

const db = pool.promise();
module.exports = db;
