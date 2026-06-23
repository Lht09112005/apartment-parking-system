const mysql2 = require("mysql2");
require("dotenv").config();

const pool = mysql2.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: 'root',
  password: '123456',
  database: 'parking_db',
  waitForConnections: true,
  connectionLimit: 10,
});

const db = pool.promise();
module.exports = db;
