const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/auth");
const fs = require("fs").promises;
const path = require("path");

const SETTINGS_FILE = path.join(__dirname, '../data/settings.json');

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Vui lòng nhập tên đăng nhập và mật khẩu" });
  }

  try {
    const [rows] = await db.query(
      `SELECT u.user_id, u.username, u.password, u.status,
              r.role_id, r.role_name,
              COALESCE(res.name, sec.name) as name,
              COALESCE(res.phone, sec.phone) as phone
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN residents res ON u.user_id = res.user_id
       LEFT JOIN security sec ON u.user_id = sec.user_id
       WHERE u.username = ?`,
      [username],
    );

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ message: "Tên đăng nhập hoặc mật khẩu không đúng" });
    }

    const user = rows[0];

    if (user.status === "locked") {
      return res
        .status(403)
        .json({ message: "Tài khoản đã bị khóa. Liên hệ quản trị viên" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Tên đăng nhập hoặc mật khẩu không đúng" });
    }

    try {
      if (user.role_id !== 1) {
        const data = await fs.readFile(SETTINGS_FILE, 'utf8');
        const settings = JSON.parse(data);
        if (settings.maintenance_mode === true) {
          return res.status(503).json({ message: "Hệ thống đang bảo trì, vui lòng quay lại sau." });
        }
      }
    } catch (e) {
      // Ignore settings file error and proceed
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        role_id: user.role_id,
        role_name: user.role_name,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        role_id: user.role_id,
        role_name: user.role_name,
        name: user.name,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.user_id, u.username, u.status, r.role_id, r.role_name,
              COALESCE(res.name, sec.name) as name,
              COALESCE(res.phone, sec.phone) as phone
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN residents res ON u.user_id = res.user_id
       LEFT JOIN security sec ON u.user_id = sec.user_id
       WHERE u.user_id = ?`,
      [req.user.user_id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("GetMe error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = { login, getMe };
