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

  const dbUser = process.env.DB_USER || 'root';
  const dbPass = process.env.DB_PASS || '123456';
  const dbName = process.env.DB_NAME || 'parking_db';
  const dbHost = process.env.DB_HOST || 'localhost';

  // Build the command carefully
  const cmd = `mysqldump -h ${dbHost} -u ${dbUser} ${dbPass ? `-p${dbPass}` : ''} ${dbName} > "${filepath}"`;

  exec(cmd, async (error, stdout, stderr) => {
    if (error) {
      console.error(`Backup error: ${error.message}`);
      return res.status(500).json({ message: 'Lỗi khi tạo backup database', error: error.message });
    }

    try {
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
      res.status(500).json({ message: 'Lỗi khi ghi lịch sử backup' });
    }
  });
};

const restoreBackup = async (req, res) => {
  const { filename } = req.params;
  const filepath = path.join(BACKUPS_DIR, filename);

  try {
    await fs.access(filepath);
  } catch (err) {
    return res.status(404).json({ message: 'File backup không tồn tại' });
  }

  const dbUser = process.env.DB_USER || 'root';
  const dbPass = process.env.DB_PASS || '123456';
  const dbName = process.env.DB_NAME || 'parking_db';
  const dbHost = process.env.DB_HOST || 'localhost';

  const cmd = `mysql -h ${dbHost} -u ${dbUser} ${dbPass ? `-p${dbPass}` : ''} ${dbName} < "${filepath}"`;

  exec(cmd, async (error, stdout, stderr) => {
    if (error) {
      console.error(`Restore error: ${error.message}`);
      return res.status(500).json({ message: 'Lỗi khi phục hồi database', error: error.message });
    }

    await logAudit(
      req.user.user_id, req.user.username, 
      "BACKUP_RESTORE", "system", null, null, 
      { filename }, 
      `Phục hồi dữ liệu từ bản sao lưu: ${filename}`, req.ip
    );

    res.json({ message: 'Phục hồi dữ liệu thành công' });
  });
};

const purgeData = async (req, res) => {
  const { before_date } = req.body;
  if (!before_date) return res.status(400).json({ message: 'Vui lòng cung cấp ngày mốc' });

  try {
    const [result] = await db.query(
      `DELETE FROM parking_session WHERE time_out IS NOT NULL AND time_out < ?`, 
      [before_date]
    );

    await logAudit(
      req.user.user_id, req.user.username, 
      "DATA_PURGE", "system", null, null, 
      { before_date, deleted_rows: result.affectedRows }, 
      `Dọn dẹp ${result.affectedRows} dòng dữ liệu cũ trước ${before_date}`, req.ip
    );

    res.json({ message: `Đã dọn dẹp ${result.affectedRows} dòng dữ liệu cũ.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi dọn dẹp dữ liệu' });
  }
};

module.exports = { listBackups, createBackup, restoreBackup, purgeData };
