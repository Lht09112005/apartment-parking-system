const db = require("../config/db");

// GET /api/residents
const getAllResidents = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.resident_id, r.name, r.apartment_number, r.phone, r.email,
              u.username, u.status
       FROM residents r
       JOIN users u ON r.user_id = u.user_id
       ORDER BY r.resident_id DESC`,
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// POST /api/residents
const createResident = async (req, res) => {
  const { username, password, name, apartment_number, phone, email } = req.body;
  if (req.user.role_id !== 2) {
    return res.status(403).json({ message: "Chỉ Admin mới có quyền thêm cư dân mới" });
  }

  if (!username || !password || !name) {
    return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
  }
  const conn = await db.getConnection();
  try {
    // Kiểm tra xem cư dân đã tồn tại chưa (trùng tên và căn hộ, hoặc trùng email/sđt)
    const [existing] = await conn.query(
      `SELECT * FROM residents WHERE (name = ? AND apartment_number = ?) OR (email != '' AND email = ?) OR (phone != '' AND phone = ?)`,
      [name, apartment_number, email, phone]
    );

    if (existing.length > 0) {
      conn.release();
      return res.status(400).json({ message: "Cư dân này (hoặc email/sđt) đã tồn tại trong hệ thống" });
    }

    await conn.beginTransaction();
    const bcrypt = require("bcrypt");
    const hashed = await bcrypt.hash(password, 10);

    const [userResult] = await conn.query(
      `INSERT INTO users (username, password, role_id) VALUES (?, ?, 4)`,
      [username, hashed],
    );
    const user_id = userResult.insertId;

    await conn.query(
      `INSERT INTO residents (user_id, name, apartment_number, phone, email) VALUES (?, ?, ?, ?, ?)`,
      [user_id, name, apartment_number, phone, email],
    );

    await conn.commit();
    res.status(201).json({ message: "Tạo cư dân thành công" });
  } catch (err) {
    await conn.rollback();
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Tên đăng nhập đã tồn tại" });
    }
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  } finally {
    conn.release();
  }
};

// PUT /api/residents/:id
const updateResident = async (req, res) => {
  const { id } = req.params;
  const { name, apartment_number, phone, email, status } = req.body;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[currentResident]] = await conn.query(
      `SELECT r.user_id, u.status
       FROM residents r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.resident_id = ?`,
      [id],
    );

    if (!currentResident) {
      await conn.rollback();
      return res.status(404).json({ message: "Không tìm thấy cư dân" });
    }

    await conn.query(
      `UPDATE residents SET name=?, apartment_number=?, phone=?, email=? WHERE resident_id=?`,
      [name, apartment_number, phone, email, id],
    );

    if (status) {
      const [[resRow]] = await conn.query(
        `SELECT r.user_id, u.status
         FROM residents r
         JOIN users u ON r.user_id = u.user_id
         WHERE r.resident_id = ?`,
        [id],
      );
      if (resRow && resRow.user_id) {
        const resetFailedAttempts = resRow.status === "locked" && status === "active" ? ", failed_attempts = 0" : "";
        await conn.query(
          `UPDATE users SET status = ?${resetFailedAttempts} WHERE user_id = ?`,
          [status, resRow.user_id],
        );
      }
    }

    await conn.commit();
    res.json({ message: "Cập nhật thành công" });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  } finally {
    conn.release();
  }
};

module.exports = { getAllResidents, createResident, updateResident };
