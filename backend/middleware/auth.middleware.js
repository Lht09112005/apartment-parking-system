const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/auth");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Không có token, từ chối truy cập" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    // Check maintenance mode - Allow role 1 (Super Admin) and 2 (Admin) to bypass
    if (![1, 2].includes(decoded.role_id)) {
      try {
        const fs = require("fs");
        const path = require("path");
        const SETTINGS_FILE = path.join(__dirname, '../data/settings.json');
        
        // Use readFileSync for middleware to avoid async/await refactoring if not needed
        // but verifyToken is not async, so readFileSync is the only way here unless we make it async
        const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
        const settings = JSON.parse(data);
        if (settings.maintenance_mode === true) {
          return res.status(503).json({ message: "Hệ thống đang bảo trì, vui lòng quay lại sau." });
        }
      } catch (e) {
        // Ignore errors
      }
    }

    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role_name;
    const userRoleId = req.user?.role_id;
    
    // Map role_id to standard names just in case string comparison fails
    let normalizedRole = userRole;
    if (userRoleId === 1) normalizedRole = "Super Admin";
    if (userRoleId === 2) normalizedRole = "Admin";
    if (userRoleId === 3) normalizedRole = "Security";
    if (userRoleId === 4) normalizedRole = "Resident";

    if (!roles.includes(normalizedRole) && !roles.includes(userRole)) {
      return res.status(403).json({
        message: `Không có quyền. Yêu cầu role: ${roles.join(", ")}`,
      });
    }
    next();
  };
};

module.exports = { verifyToken, authorizeRoles };
