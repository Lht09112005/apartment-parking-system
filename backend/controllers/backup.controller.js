const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const db = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

const BACKUPS_DIR = path.join(__dirname, '../data/backups');
const HISTORY_FILE = path.join(__dirname, '../data/backup_history.json');

const getBackupHistory = async () => {
  try {
    const data = await fs.readFile(HISTORY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const saveBackupHistory = async (history) => {
  await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
};

const listBackups = async (req, res) => {
  try {
    const history = await getBackupHistory();
    res.json(history);
  } catch (err) {
    console.error('Error reading backup history:', err);
    res.status(500).json({ message: 'Lỗi khi đọc lịch sử backup' });
  }
};

const createBackup = async (req, res) => {
  const timestamp = Date.now();
  const filename = `backup_${timestamp}.sql`;
  const filepath = path.join(BACKUPS_DIR, filename);

  try {
    // 1. Lấy tên database hiện tại
    const dbName = process.env.DB_NAME || 'parking_db';

    // 2. Lấy danh sách bảng trong database
    const [tablesRows] = await db.query("SHOW TABLES");
    const key = `Tables_in_${dbName}`;
    const tables = tablesRows.map(row => row[key] || Object.values(row)[0]);

    let sqlContent = `-- Parking Database Backup\n`;
    sqlContent += `-- Created: ${new Date().toISOString()}\n`;
    sqlContent += `USE \`${dbName}\`;\n\n`;
    sqlContent += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    for (const table of tables) {
      sqlContent += `-- Table: ${table}\n`;
      sqlContent += `DROP TABLE IF EXISTS \`${table}\`;\n`;

      // Lấy câu lệnh tạo bảng
      const [[createRow]] = await db.query(`SHOW CREATE TABLE \`${table}\``);
      const createTableSql = createRow['Create Table'] || Object.values(createRow)[1];
      sqlContent += `${createTableSql};\n\n`;

      // Lấy dữ liệu của bảng
      const [rows] = await db.query(`SELECT * FROM \`${table}\``);
      if (rows.length > 0) {
        const columns = Object.keys(rows[0]).map(col => `\`${col}\``).join(', ');
        sqlContent += `INSERT INTO \`${table}\` (${columns}) VALUES\n`;
        
        const insertValues = rows.map(row => {
          const vals = Object.values(row).map(val => {
            if (val === null) return 'NULL';
            if (typeof val === 'number') return val;
            if (val instanceof Date) {
              // Convert to UTC/MySQL date format
              return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
            }
            // Tránh lỗi escape SQL injection và ký tự đặc biệt
            const escaped = String(val)
              .replace(/\\/g, '\\\\')
              .replace(/'/g, "\\'")
              .replace(/"/g, '\\"')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r');
            return `'${escaped}'`;
          }).join(', ');
          return `(${vals})`;
        }).join(',\n');
        
        sqlContent += `${insertValues};\n\n`;
      }
    }

    sqlContent += `SET FOREIGN_KEY_CHECKS = 1;\n`;

    // Đảm bảo thư mục lưu trữ tồn tại và ghi file
    await fs.mkdir(BACKUPS_DIR, { recursive: true });
    await fs.writeFile(filepath, sqlContent, 'utf8');

    const stats = await fs.stat(filepath);
    const history = await getBackupHistory();
    
    const newRecord = {
      backup_id: timestamp,
      filename,
      size_bytes: stats.size,
      created_by: req.user.username,
      created_at: new Date().toISOString()
    };
    
    history.unshift(newRecord);
    await saveBackupHistory(history);

    await logAudit(
      req.user.user_id, req.user.username, 
      "BACKUP_CREATE", "system", null, null, 
      { filename, size_bytes: stats.size }, 
      `Tạo bản sao lưu dữ liệu: ${filename}`, req.ip
    );

    res.status(201).json({ message: 'Tạo bản sao lưu thành công', backup: newRecord });
  } catch (err) {
    console.error("Backup error:", err);
    res.status(500).json({ message: 'Lỗi khi tạo backup database', error: err.message });
  }
};

const restoreBackup = async (req, res) => {
  const { filename } = req.params;
  const filepath = path.join(BACKUPS_DIR, filename);

  try {
    await fs.access(filepath);
  } catch (err) {
    return res.status(404).json({ message: 'File backup không tồn tại' });
  }

  try {
    const sqlContent = await fs.readFile(filepath, 'utf8');
    
    // Tách các câu lệnh SQL bằng regex
    const statements = sqlContent
      .split(/;\s*$/m)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

    // Chạy từng câu lệnh SQL tuần tự trên connection
    const connection = await db.getConnection();
    try {
      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      
      for (const statement of statements) {
        if (statement.toUpperCase().startsWith("USE ")) continue;
        await connection.query(statement);
      }
      
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    } finally {
      connection.release();
    }

    await logAudit(
      req.user.user_id, req.user.username, 
      "BACKUP_RESTORE", "system", null, null, 
      { filename }, 
      `Phục hồi dữ liệu từ bản sao lưu: ${filename}`, req.ip
    );

    res.json({ message: 'Phục hồi dữ liệu thành công' });
  } catch (err) {
    console.error("Restore error:", err);
    res.status(500).json({ message: 'Lỗi khi khôi phục database', error: err.message });
  }
};

const purgeData = async (req, res) => {
  const { before_date } = req.body;
  if (!before_date) return res.status(400).json({ message: 'Vui lòng cung cấp ngày mốc' });

  try {
    // 1. Dọn dẹp bảng parking_session
    const [sessionResult] = await db.query(
      `DELETE FROM parking_session WHERE time_out IS NOT NULL AND time_out < ?`, 
      [before_date]
    );

    // 2. Dọn dẹp bảng notifications
    const [notifResult] = await db.query(
      `DELETE FROM notifications WHERE created_at < ?`,
      [before_date]
    );

    // 3. Dọn dẹp audit_logs (JSON file)
    let logsDeleted = 0;
    const AUDIT_FILE = path.join(__dirname, '../data/audit_logs.json');
    try {
      const data = await fs.readFile(AUDIT_FILE, 'utf8');
      const logs = JSON.parse(data);
      const purgeDateObj = new Date(before_date);
      
      const newLogs = logs.filter(log => {
        const logDate = new Date(log.created_at);
        return logDate >= purgeDateObj;
      });
      
      logsDeleted = logs.length - newLogs.length;
      if (logsDeleted > 0) {
        await fs.writeFile(AUDIT_FILE, JSON.stringify(newLogs, null, 2), 'utf8');
      }
    } catch (err) {
      console.error("Lỗi khi dọn dẹp audit logs:", err);
    }

    await logAudit(
      req.user.user_id, req.user.username, 
      "DATA_PURGE", "system", null, null, 
      { before_date, session_deleted: sessionResult.affectedRows, notif_deleted: notifResult.affectedRows, logs_deleted: logsDeleted }, 
      `Dọn dẹp ${sessionResult.affectedRows} lượt xe, ${notifResult.affectedRows} thông báo, ${logsDeleted} log cũ trước ${before_date}`, req.ip
    );

    res.json({ message: `Đã dọn dẹp ${sessionResult.affectedRows} lượt xe, ${notifResult.affectedRows} thông báo và ${logsDeleted} log hệ thống cũ.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi dọn dẹp dữ liệu' });
  }
};

const downloadBackup = async (req, res) => {
  const { filename } = req.params;
  const filepath = path.join(BACKUPS_DIR, filename);

  try {
    await fs.access(filepath);
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error("Lỗi khi tải file backup:", err);
      }
    });
  } catch (err) {
    return res.status(404).json({ message: 'File backup không tồn tại' });
  }
};

module.exports = { listBackups, createBackup, restoreBackup, purgeData, downloadBackup };
