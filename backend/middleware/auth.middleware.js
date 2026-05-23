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
