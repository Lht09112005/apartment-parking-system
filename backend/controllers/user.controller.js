const bcrypt = require("bcrypt");
const db = require("../config/db");

const getAllUsers = async (req, res) => {
  try {
    // Super Admin (1) sees Admins (2). Admin (2) sees Security (3).
    const currentUserRole = req.user.role_id;
    let targetRoleId = 2; // Default for Super Admin
    if (currentUserRole === 2) targetRoleId = 3;

    const [rows] = await db.query(
      `SELECT u.user_id, u.username, u.status, u.created_at,
          r.role_id, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE r.role_id = ?
       ORDER BY u.created_at DESC`,
       [targetRoleId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const createUser = async (req, res) => {
  const { username, password, role_id } = req.body;
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
      await db.query(`INSERT INTO security (user_id, name) VALUES (?, ?)`, [result.insertId, username]);
    }

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
  const { role_id, status, username, password } = req.body;

  try {
    // Permission check
    const [targetUser] = await db.query(`SELECT role_id FROM users WHERE user_id = ?`, [id]);
    if (targetUser.length === 0) return res.status(404).json({ message: "Người dùng không tồn tại" });
    
    const currentUserRole = req.user.role_id;
    const targetUserRole = targetUser[0].role_id;

    if (currentUserRole === 1 && targetUserRole !== 2) {
        return res.status(403).json({ message: "Super Admin chỉ được sửa tài khoản Admin" });
    }
    if (currentUserRole === 2 && targetUserRole !== 3) {
        return res.status(403).json({ message: "Admin chỉ được sửa tài khoản Security" });
    }

    let query = `UPDATE users SET status = ?`;
    let params = [status];

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
    res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = { getAllUsers, createUser, updateUser, resetPassword };
