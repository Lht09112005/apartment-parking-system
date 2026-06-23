const bcrypt = require("bcrypt");
const db = require("../config/db");
const { logAudit } = require("../utils/auditLogger");
const NotificationService = require("../services/notification.service");

const getAllUsers = async (req, res) => {
  try {
    const currentUserRole = req.user.role_id;

    if (currentUserRole === 1) {
      const [rows] = await db.query(
        `SELECT u.user_id, u.username, u.status, u.failed_attempts, u.created_at,
            r.role_id, r.role_name,
            COALESCE(s.name, res.name) as staff_name,
            COALESCE(s.phone, res.phone) as staff_phone
         FROM users u
         JOIN roles r ON u.role_id = r.role_id
         LEFT JOIN security s ON u.user_id = s.user_id
         LEFT JOIN residents res ON u.user_id = res.user_id
         WHERE r.role_id IN (2, 3, 4)
         ORDER BY u.created_at DESC`
      );
      return res.json(rows);
    }

    const [rows] = await db.query(
      `SELECT u.user_id, u.username, u.status, u.failed_attempts, u.created_at,
          r.role_id, r.role_name,
          s.name as staff_name, s.phone as staff_phone
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN security s ON u.user_id = s.user_id
       WHERE r.role_id = ?
       ORDER BY u.created_at DESC`,
       [3]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const createUser = async (req, res) => {
  const { username, password, role_id, name, phone } = req.body;
  if (!username || !password || !role_id) {
    return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
  }

  const currentUserRole = req.user.role_id;
  if (currentUserRole === 1 && role_id !== 2) {
    return res.status(403).json({ message: "Super Admin chỉ được tạo tài khoản Admin" });
  }
  if (currentUserRole === 2 && role_id !== 3) {
    return res.status(403).json({ message: "Admin chỉ được tạo tài khoản Security" });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO users (username, password, role_id) VALUES (?, ?, ?)`,
      [username, hashed, role_id],
    );

    // If creating Security, also add to security table
    if (role_id === 3) {
      await db.query(`INSERT INTO security (user_id, name, phone) VALUES (?, ?, ?)`, [result.insertId, name || username, phone || null]);
    }

    await logAudit(
      req.user.user_id, 
      req.user.username, 
      "CREATE", 
      "user", 
      result.insertId, 
      null, 
      { username, role_id, status: "active" }, 
      `Tạo tài khoản ${role_id === 2 ? 'Admin' : 'Security'}: ${username}`, 
      req.ip
    );


    res.status(201).json({ message: "Tạo tài khoản thành công", user_id: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Tên đăng nhập đã tồn tại" });
    }
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { role_id, status, username, password, name, phone } = req.body;

  try {
    // Permission check
    const [targetUser] = await db.query(`SELECT role_id, status FROM users WHERE user_id = ?`, [id]);
    if (targetUser.length === 0) return res.status(404).json({ message: "Người dùng không tồn tại" });
    
    const currentUserRole = req.user.role_id;
    const targetUserRole = targetUser[0].role_id;
    const targetUserStatus = targetUser[0].status;

    if (!["active", "locked"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái tài khoản không hợp lệ" });
    }

    const isUnlocking = (targetUserStatus === 'locked' && status === 'active');
    const hasProfileChanges = username || password || name || phone || (role_id && role_id !== targetUserRole);
    const isSuperAdminStatusOnlyChange =
      currentUserRole === 1 &&
      !hasProfileChanges &&
      targetUserRole === 2;
    const isAdminStatusOnlyChange =
      currentUserRole === 2 &&
      !hasProfileChanges &&
      targetUserRole === 3;

    if (currentUserRole === 1 && !hasProfileChanges && targetUserRole !== 2) {
      return res.status(403).json({ message: "Super Admin chỉ được khóa/mở khóa tài khoản Admin" });
    }
    if (currentUserRole === 2 && !hasProfileChanges && targetUserRole !== 3) {
      return res.status(403).json({ message: "Admin chỉ được khóa/mở khóa tài khoản Security" });
    }

    if (isUnlocking && targetUserRole === 2 && currentUserRole !== 1) {
      return res.status(403).json({ message: "Chỉ Super Admin mới có quyền mở khóa tài khoản Admin" });
    }
    if (isUnlocking && targetUserRole === 3 && currentUserRole !== 2) {
      return res.status(403).json({ message: "Chỉ Admin mới có quyền mở khóa tài khoản Security" });
    }

    if (!isUnlocking && !isSuperAdminStatusOnlyChange && !isAdminStatusOnlyChange) {
      if (currentUserRole === 1 && targetUserRole !== 2) {
          return res.status(403).json({ message: "Super Admin chỉ được sửa tài khoản Admin" });
      }
      if (currentUserRole === 2 && targetUserRole !== 3) {
          return res.status(403).json({ message: "Admin chỉ được sửa tài khoản Security" });
      }
    }

    let query = `UPDATE users SET status = ?`;
    let params = [status];

    if (status === 'active' && targetUserStatus === 'locked') {
      query += `, failed_attempts = 0`;
    }

    // Role can only be changed within allowed scope
    if (role_id) {
        query += `, role_id = ?`;
        params.push(role_id);
    }

    if (username) {
      query += `, username = ?`;
      params.push(username);
    }

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      query += `, password = ?`;
      params.push(hashed);
    }

    query += ` WHERE user_id = ?`;
    params.push(id);

    await db.query(query, params);

    // If updating Security profile fields, also update security table
    if (targetUserRole === 3 && (username !== undefined || name !== undefined || phone !== undefined)) {
      const [secExists] = await db.query(`SELECT staff_id FROM security WHERE user_id = ?`, [id]);
      if (secExists.length > 0) {
        await db.query(
          `UPDATE security SET name = ?, phone = ? WHERE user_id = ?`,
          [name || username, phone || null, id]
        );
      } else {
        await db.query(
          `INSERT INTO security (user_id, name, phone) VALUES (?, ?, ?)`,
          [id, name || username, phone || null]
        );
      }
    }

    await logAudit(
      req.user.user_id, 
      req.user.username, 
      "UPDATE", 
      "user", 
      id, 
      null, 
      { status, role_id, username, password_changed: !!password }, 
      `Cập nhật tài khoản user_id ${id}`, 
      req.ip
    );


    res.json({ message: "Cập nhật tài khoản thành công" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Tên đăng nhập đã tồn tại" });
    }
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const resetPassword = async (req, res) => {
  const { id } = req.params;
  const { new_password } = req.body;
  if (!new_password) {
    return res.status(400).json({ message: "Vui lòng nhập mật khẩu mới" });
  }
  try {
    // Permission check
    const [targetUser] = await db.query(`SELECT role_id FROM users WHERE user_id = ?`, [id]);
    if (targetUser.length === 0) return res.status(404).json({ message: "Người dùng không tồn tại" });

    const currentUserRole = req.user.role_id;
    const targetUserRole = targetUser[0].role_id;

    if (currentUserRole === 1 && targetUserRole !== 2) {
        return res.status(403).json({ message: "Super Admin chỉ được đổi mật khẩu Admin" });
    }
    if (currentUserRole === 2 && targetUserRole !== 3) {
        return res.status(403).json({ message: "Admin chỉ được đổi mật khẩu Security" });
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await db.query(`UPDATE users SET password = ? WHERE user_id = ?`, [
      hashed,
      id,
    ]);
    
    await logAudit(
      req.user.user_id, 
      req.user.username, 
      "RESET_PASSWORD", 
      "user", 
      id, 
      null, 
      null, 
      `Reset mật khẩu cho user_id ${id}`, 
      req.ip
    );


    res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = { getAllUsers, createUser, updateUser, resetPassword };
