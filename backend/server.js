const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("./utils/cron");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const residentRoutes = require("./routes/resident.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const vehicleRoutes = require("./routes/vehicle.routes");
const parkingRoutes = require("./routes/parking.routes");
const residentPortalRoutes = require("./routes/resident.portal.routes");
const settingsRoutes = require("./routes/settings.routes");
const auditRoutes = require("./routes/audit.routes");
const backupRoutes = require("./routes/backup.routes");
const { checkMaintenanceMode } = require("./middleware/maintenance.middleware");
const app = express();
const realtimeRoutes = require("./routes/realtime.routes");
const { notifyDataChanges } = require("./middleware/realtime.middleware");
const { JWT_SECRET } = require("./config/auth");

app.use(cors());
app.use(express.json());
// Thông báo realtime cho frontend khi dữ liệu thay đổi qua API
app.use(notifyDataChanges);

app.use("/api/realtime", realtimeRoutes);

// Maintenance mode check (must verify token first to skip admins)
// For routes that need it, we can apply it. But to keep it simple, we'll apply it globally after parsing body, but we need user info.
// Instead of applying globally, it's better to add it to specific routes or add verifyToken + checkMaintenanceMode.
// Actually, applying it globally without verifyToken means req.user is undefined.
// Let's use it as a custom middleware that runs before routes, but we need auth info.
// To fix this cleanly, we can apply it to specific groups.
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/auth')) return next();
  // We need to verify token softly to see if user is superadmin
  const token = req.headers.authorization?.split(" ")[1] || req.query.token;
  if (token) {
    const jwt = require("jsonwebtoken");
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (e) {}
  }
  next();
});
app.use(checkMaintenanceMode);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/residents", residentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/parking", parkingRoutes);
app.use("/api/resident", residentPortalRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/backup", backupRoutes);
app.use("/api/notifications", notificationRoutes);
app.get("/", (req, res) => res.json({ message: "Parking API running..." }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
