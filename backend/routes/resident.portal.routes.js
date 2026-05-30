const express = require("express");
const router = express.Router();
const {
  verifyToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");
const db = require("../config/db");

router.use(verifyToken);
router.use(authorizeRoles("Resident"));

// GET /api/resident/profile - Lấy thông tin cá nhân của cư dân
router.get("/profile", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.resident_id, r.name, r.apartment_number, r.phone, r.email,
              u.username, u.status
       FROM residents r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.user_id = ?`,
      [req.user.user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy thông tin cư dân" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// PUT /api/resident/profile - Cập nhật thông tin cá nhân
router.put("/profile", async (req, res) => {
  const { name, phone, email } = req.body;
  try {
    const [resident] = await db.query(
      `SELECT resident_id FROM residents WHERE user_id = ?`,
      [req.user.user_id]
    );
    if (resident.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy thông tin cư dân" });
    }
    await db.query(
      `UPDATE residents SET name=?, phone=?, email=? WHERE resident_id=?`,
      [name, phone, email, resident[0].resident_id]
    );
    res.json({ message: "Cập nhật thông tin thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// GET /api/resident/vehicles - Lấy danh sách xe của cư dân
router.get("/vehicles", async (req, res) => {
  try {
    const [resident] = await db.query(
      `SELECT resident_id FROM residents WHERE user_id = ?`,
      [req.user.user_id]
    );
    if (resident.length === 0) {
      return res.json([]);
    }
      const [rows] = await db.query(
        `SELECT v.plate_number, v.color, vt.type_name, v.type_id, v.status,
                mp.monthly_id, mp.start_date, mp.end_date, mp.status as monthly_status
         FROM vehicles v
         LEFT JOIN vehicle_types vt ON v.type_id = vt.type_id
         LEFT JOIN (
           SELECT mp1.*
           FROM monthly_parking mp1
           INNER JOIN (
             SELECT plate_number, MAX(monthly_id) as max_id
             FROM monthly_parking
             GROUP BY plate_number
           ) mp2 ON mp1.plate_number = mp2.plate_number AND mp1.monthly_id = mp2.max_id
         ) mp ON v.plate_number = mp.plate_number
         WHERE v.resident_id = ? AND v.status != 'deleted'
         ORDER BY v.plate_number ASC`,
        [resident[0].resident_id]
      );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// POST /api/resident/vehicles - Đăng ký xe mới
router.post("/vehicles", async (req, res) => {
  const { plate_number, type_id, color } = req.body;
  if (!plate_number || !type_id) {
    return res.status(400).json({ message: "Vui lòng nhập biển số và loại xe" });
  }
  try {
    const [resident] = await db.query(
      `SELECT resident_id, name, apartment_number FROM residents WHERE user_id = ?`,
      [req.user.user_id]
    );
    if (resident.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy thông tin cư dân" });
    }
    await db.query(
      `INSERT INTO vehicles (plate_number, resident_id, type_id, color, status) VALUES (?, ?, ?, ?, 'pending')`,
      [plate_number, resident[0].resident_id, type_id, color]
    );

    // Gửi thông báo cho Admin & Super Admin (Role 1 & 2)
    try {
      const [[vehicleType]] = await db.query(`SELECT type_name FROM vehicle_types WHERE type_id = ?`, [type_id]);
      const typeName = vehicleType ? vehicleType.type_name : "Chưa xác định";
      const NotificationService = require("../services/notification.service");
      await NotificationService.notifyRole(
        [1, 2],
        "Yêu cầu duyệt đăng ký xe mới",
        `Cư dân ${resident[0].name} (Căn hộ ${resident[0].apartment_number}) đã đăng ký xe mới biển số ${plate_number}, loại xe ${typeName}. Vui lòng phê duyệt.`,
        "VEHICLE_APPROVAL_REQUEST"
      );
    } catch (notifErr) {
      console.error("Lỗi gửi thông báo đăng ký xe:", notifErr);
    }

    res.status(201).json({ message: "Đăng ký xe thành công" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Biển số xe đã tồn tại" });
    }
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// PUT /api/resident/vehicles/:plate_number - Cập nhật thông tin xe
router.put("/vehicles/:plate_number", async (req, res) => {
  const { plate_number } = req.params;
  const { type_id, color, new_plate_number } = req.body;
  console.log("PUT /vehicles/:plate_number called with params:", req.params, "body:", req.body);
  try {
    const [resident] = await db.query(
      `SELECT resident_id, name, apartment_number FROM residents WHERE user_id = ?`,
      [req.user.user_id]
    );
    if (resident.length === 0) {
      console.log("Resident not found for user_id:", req.user.user_id);
      return res.status(404).json({ message: "Không tìm thấy thông tin cư dân" });
    }
    console.log("Found resident:", resident[0]);

    // Verify ownership
    console.log("Verifying ownership for plate:", plate_number, "resident_id:", resident[0].resident_id);
    const [vehicle] = await db.query(`SELECT status FROM vehicles WHERE plate_number = ? AND resident_id = ?`, [plate_number, resident[0].resident_id]);
    if (vehicle.length === 0) {
      console.log("Vehicle not found for ownership verify");
      return res.status(403).json({ message: "Xe không thuộc quyền sở hữu của bạn" });
    }
    console.log("Vehicle found:", vehicle[0]);

    const targetPlate = new_plate_number && new_plate_number.trim() ? new_plate_number : plate_number;

    await db.query(`UPDATE vehicles SET plate_number=?, type_id=?, color=?, status='pending' WHERE plate_number=? AND resident_id=?`, [targetPlate, type_id, color, plate_number, resident[0].resident_id]);

    // Gửi thông báo cập nhật thông tin xe cho Admin & Super Admin (Role 1 & 2)
    try {
      const [[vehicleType]] = await db.query(`SELECT type_name FROM vehicle_types WHERE type_id = ?`, [type_id]);
      const typeName = vehicleType ? vehicleType.type_name : "Chưa xác định";
      const NotificationService = require("../services/notification.service");
      await NotificationService.notifyRole(
        [1, 2],
        "Yêu cầu duyệt đăng ký xe mới",
        `Cư dân ${resident[0].name} (Căn hộ ${resident[0].apartment_number}) đã cập nhật thông tin xe biển số ${targetPlate}, loại xe ${typeName}. Vui lòng phê duyệt.`,
        "VEHICLE_APPROVAL_REQUEST"
      );
    } catch (notifErr) {
      console.error("Lỗi gửi thông báo cập nhật xe:", notifErr);
    }

    res.json({ message: "Cập nhật thành công, đang chờ Admin duyệt lại" });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Biển số xe mới đã tồn tại trong hệ thống" });
    }
    if (err.code === "ER_ROW_IS_REFERENCED_2" || err.code === "ER_ROW_IS_REFERENCED") {
      return res.status(400).json({ message: "Không thể đổi biển số vì xe đã có lịch sử gửi xe hoặc vé tháng. Vui lòng liên hệ Admin." });
    }
    res.status(500).json({ message: "Lỗi server" });
  }
});

// DELETE /api/resident/vehicles/:plate_number - Xóa xe
router.delete("/vehicles/:plate_number", async (req, res) => {
  const { plate_number } = req.params;
  try {
    const [resident] = await db.query(
      `SELECT resident_id FROM residents WHERE user_id = ?`,
      [req.user.user_id]
    );
    if (resident.length === 0) return res.status(404).json({ message: "Không tìm thấy thông tin cư dân" });

    // Verify ownership
    const [vehicle] = await db.query(`SELECT plate_number FROM vehicles WHERE plate_number = ? AND resident_id = ?`, [plate_number, resident[0].resident_id]);
    if (vehicle.length === 0) return res.status(403).json({ message: "Xe không thuộc quyền sở hữu của bạn" });

    await db.query(`UPDATE vehicles SET status = 'deleted' WHERE plate_number=? AND resident_id=?`, [plate_number, resident[0].resident_id]);
    res.json({ message: "Xóa xe thành công" });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_ROW_IS_REFERENCED_2" || err.code === "ER_ROW_IS_REFERENCED") {
      return res.status(400).json({ message: "Không thể xóa xe vì xe đã có lịch sử gửi xe hoặc vé tháng. Vui lòng liên hệ Admin." });
    }
    res.status(500).json({ message: "Lỗi server" });
  }
});

// POST /api/resident/monthly - Đăng ký gửi xe theo tháng
router.post("/monthly", async (req, res) => {
  const { plate_number } = req.body;
  if (!plate_number) {
    return res.status(400).json({ message: "Vui lòng chọn xe" });
  }
  try {
    // Verify the vehicle belongs to this resident
    const [resident] = await db.query(
      `SELECT resident_id, name, apartment_number FROM residents WHERE user_id = ?`,
      [req.user.user_id]
    );
    if (resident.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy thông tin cư dân" });
    }
    const [vehicle] = await db.query(
      `SELECT v.plate_number, v.type_id, v.status FROM vehicles v WHERE v.plate_number = ? AND v.resident_id = ?`,
      [plate_number, resident[0].resident_id]
    );
    if (vehicle.length === 0) {
      return res.status(403).json({ message: "Xe không thuộc quyền sở hữu của bạn" });
    }
    if (vehicle[0].status !== 'active') {
      return res.status(400).json({ message: "Xe chưa được duyệt. Vui lòng đợi Admin duyệt trước khi đăng ký vé tháng." });
    }

    // Check if already has active monthly
    const [existing] = await db.query(
      `SELECT * FROM monthly_parking WHERE plate_number = ? AND status IN ('active', 'pending')`,
      [plate_number]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "Xe này đã có đăng ký vé tháng (đang hoạt động hoặc chờ duyệt)" });
    }

    // Find area
    const [areas] = await db.query(
      `SELECT area_id FROM parking_area WHERE type_id = ? LIMIT 1`,
      [vehicle[0].type_id]
    );
    const area_id = areas.length > 0 ? areas[0].area_id : null;
    if (!area_id) {
      return res.status(400).json({ message: "Không tìm thấy khu vực phù hợp cho loại xe này" });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    await db.query(
      `INSERT INTO monthly_parking (plate_number, area_id, start_date, end_date, status) VALUES (?, ?, ?, ?, 'pending')`,
      [plate_number, area_id, startDate, endDate]
    );

    // Gửi thông báo cho Admin & Super Admin (Role 1 & 2)
    try {
      const NotificationService = require("../services/notification.service");
      await NotificationService.notifyRole(
        [1, 2],
        "Yêu cầu duyệt vé tháng",
        `Cư dân ${resident[0].name} (Căn hộ ${resident[0].apartment_number}) đã gửi yêu cầu đăng ký vé tháng cho xe biển số ${plate_number}.`,
        "MONTHLY_APPROVAL_REQUEST"
      );
    } catch (notifErr) {
      console.error("Lỗi gửi thông báo đăng ký vé tháng:", notifErr);
    }

    res.status(201).json({ message: "Đăng ký vé tháng thành công, đang chờ duyệt" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// GET /api/resident/history - Lịch sử gửi xe
router.get("/history", async (req, res) => {
  try {
    const [resident] = await db.query(
      `SELECT resident_id FROM residents WHERE user_id = ?`,
      [req.user.user_id]
    );
    if (resident.length === 0) {
      return res.json([]);
    }
    const [rows] = await db.query(
      `SELECT s.session_id, s.plate_number,
              s.time_in, s.time_out, s.status, vt.type_name
       FROM parking_session s
       LEFT JOIN vehicle_types vt ON s.type_id = vt.type_id
       WHERE s.plate_number IN (SELECT plate_number FROM vehicles WHERE resident_id = ?)
       ORDER BY s.time_in DESC`,
      [resident[0].resident_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// GET /api/resident/fees - Tra cứu phí & hóa đơn
router.get("/fees", async (req, res) => {
  try {
    const [resident] = await db.query(
      `SELECT resident_id FROM residents WHERE user_id = ?`,
      [req.user.user_id]
    );
    if (resident.length === 0) {
      return res.json({ feeConfig: [], monthlyRegistrations: [] });
    }

    // Bảng giá
    const [feeConfig] = await db.query(
      `SELECT pf.type_id, vt.type_name, pf.price_per_hour, pf.monthly_fee
       FROM parking_fee pf
       JOIN vehicle_types vt ON pf.type_id = vt.type_id
       WHERE vt.type_name != 'Xe điện'`
    );

    // Vé tháng đang đăng ký
    const [monthlyRegistrations] = await db.query(
      `SELECT mp.monthly_id, mp.plate_number, mp.start_date, mp.end_date, mp.status,
              vt.type_name, pf.monthly_fee
       FROM monthly_parking mp
       JOIN vehicles v ON mp.plate_number = v.plate_number
       JOIN vehicle_types vt ON v.type_id = vt.type_id
       JOIN parking_fee pf ON v.type_id = pf.type_id
       WHERE v.resident_id = ?
       ORDER BY mp.start_date DESC`,
      [resident[0].resident_id]
    );

    res.json({ feeConfig, monthlyRegistrations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// GET /api/resident/vehicle-types
router.get("/vehicle-types", async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM vehicle_types WHERE type_name != 'Xe điện'`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
