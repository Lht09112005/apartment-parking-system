const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/auth");
const { logAudit } = require("../utils/auditLogger");
const fs = require("fs").promises;
const path = require("path");

const SETTINGS_FILE = path.join(__dirname, '../data/settings.json');
const loginAttempts = new Map(); // Map<user_id, { count, lockedUntil }>
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 phút

const getUnlockContactMessage = (roleId, roleName = "") => {
  const normalizedRoleId = Number(roleId);
  const normalizedRoleName = String(roleName).toLowerCase();

  if (normalizedRoleId === 2 || normalizedRoleName === "admin") {
    return "Liên hệ Super Admin để mở khóa.";
  }
  if (
    [3, 4].includes(normalizedRoleId) ||
    normalizedRoleName === "security" ||
    normalizedRoleName === "resident"
  ) {
    return "Liên hệ Admin để mở khóa.";
  }
  return "Liên hệ quản trị viên để mở khóa.";
};

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

    // Kiểm tra khóa tạm thời bằng In-Memory
    const attemptInfo = loginAttempts.get(user.user_id) || { count: 0, lockedUntil: null };
    if (attemptInfo.lockedUntil && new Date() < attemptInfo.lockedUntil) {
      const remainMinutes = Math.ceil((attemptInfo.lockedUntil - Date.now()) / 60000);
      return res.status(403).json({
        message: `Tài khoản tạm thời bị khóa. Vui lòng thử lại sau ${remainMinutes} phút.`,
      });
    }

    // Kiểm tra tài khoản bị Admin khóa thủ công
    if (user.status === "locked") {
      return res
        .status(403)
        .json({ message: `Tài khoản đã bị khóa bởi quản trị viên. ${getUnlockContactMessage(user.role_id, user.role_name)}` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      let maxLoginAttempts = 5;
      try {
        const data = await fs.readFile(SETTINGS_FILE, 'utf8');
        const settings = JSON.parse(data);
        if (settings.max_login_attempts !== undefined) {
          maxLoginAttempts = parseInt(settings.max_login_attempts) || 5;
        }
      } catch (e) {
        // ignore
      }

      const currentAttempts = (attemptInfo.count || 0) + 1;
      loginAttempts.set(user.user_id, { count: currentAttempts, lockedUntil: null });

      if (currentAttempts >= maxLoginAttempts) {
        // Khóa tạm 15 phút trong bộ nhớ, KHÔNG ghi vào database
        loginAttempts.set(user.user_id, {
          count: currentAttempts,
          lockedUntil: new Date(Date.now() + LOCK_DURATION_MS),
        });
        return res
          .status(403)
          .json({ message: `Bạn đã nhập sai mật khẩu quá ${maxLoginAttempts} lần. Vui lòng thử lại sau 15 phút.` });
      } else {
        const remaining = maxLoginAttempts - currentAttempts;
        return res
          .status(401)
          .json({ message: `Tên đăng nhập hoặc mật khẩu không đúng. Bạn còn ${remaining} lần thử.` });
      }
    }

    loginAttempts.delete(user.user_id);

    try {
      if (![1, 2].includes(user.role_id)) {
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

const changeCredentials = async (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body;
  const user_id = req.user.user_id;

  if (!currentPassword) {
    return res.status(400).json({ message: "Vui lòng nhập mật khẩu hiện tại" });
  }

  try {
    const [rows] = await db.query(`SELECT password, username FROM users WHERE user_id = ?`, [user_id]);
    if (rows.length === 0) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) {
      return res.status(401).json({ message: "Mật khẩu hiện tại không đúng" });
    }

    if (newUsername && newUsername !== rows[0].username) {
      const [existing] = await db.query(`SELECT user_id FROM users WHERE username = ? AND user_id != ?`, [newUsername, user_id]);
      if (existing.length > 0) {
        return res.status(400).json({ message: "Tên đăng nhập mới đã tồn tại trong hệ thống" });
      }
      await db.query(`UPDATE users SET username = ? WHERE user_id = ?`, [newUsername, user_id]);
    }

    if (newPassword) {
      const hashed = await bcrypt.hash(newPassword, 10);
      await db.query(`UPDATE users SET password = ? WHERE user_id = ?`, [hashed, user_id]);
    }

    // Ghi log audit hoạt động tự cập nhật tài khoản/mật khẩu
    await logAudit(
      user_id,
      rows[0].username,
      "UPDATE_CREDENTIALS",
      "user",
      user_id,
      null,
      { username_changed: !!(newUsername && newUsername !== rows[0].username), password_changed: !!newPassword },
      `Người dùng ${rows[0].username} tự cập nhật thông tin tài khoản đăng nhập (đổi mật khẩu)`,
      req.ip
    );

    res.json({ message: "Cập nhật tài khoản thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = { login, getMe, changeCredentials };
