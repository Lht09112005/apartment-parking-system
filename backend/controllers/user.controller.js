const bcrypt = require("bcrypt");
const db = require("../config/db");

const getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.user_id, u.username, u.status, u.created_at,
          r.role_id, r.role_name
   FROM users u
   JOIN roles r ON u.role_id = r.role_id
  WHERE r.role_id = 2
   ORDER BY u.created_at DESC`,
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
  if (role_id !== 2) {
    return res
      .status(403)
      .json({ message: "Super Admin chỉ được tạo tài khoản Admin" });
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO users (username, password, role_id) VALUES (?, ?, ?)`,
      [username, hashed, role_id],
    );
    res
      .status(201)
      .json({ message: "Tạo tài khoản thành công", user_id: result.insertId });
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
    let query = `UPDATE users SET role_id = ?, status = ?`;
    let params = [role_id, status];

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
