const db = require("../config/db");
const NotificationService = require("../services/notification.service");
const { logAudit } = require("../utils/auditLogger");

// GET /api/vehicles
const getAllVehicles = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT v.plate_number, v.color, r.name as resident_name, r.apartment_number, vt.type_name, v.resident_id, v.type_id, v.status
       FROM vehicles v
       LEFT JOIN residents r ON v.resident_id = r.resident_id
       LEFT JOIN vehicle_types vt ON v.type_id = vt.type_id
       WHERE v.status != 'deleted'
       ORDER BY v.plate_number ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// POST /api/vehicles
const createVehicle = async (req, res) => {
  const { plate_number, resident_id, type_id, color } = req.body;
  if (!plate_number || !resident_id || !type_id) {
    return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
  }
  try {
    await db.query(
      `INSERT INTO vehicles (plate_number, resident_id, type_id, color, status) VALUES (?, ?, ?, ?, 'active')`,
      [plate_number, resident_id, type_id, color]
    );
    // ... logic thêm xe hiện tại của bạn ...

    // Gửi thông báo cho Admin (Role 1 & 2)
    const [[resident]] = await db.query(`SELECT name, apartment_number FROM residents WHERE resident_id = ?`, [resident_id]);
    if (resident) {
      await NotificationService.notifyRole(
        [2],
        "Yêu cầu duyệt đăng ký xe mới",
        `Cư dân ${resident.name} (Căn hộ ${resident.apartment_number}) đã đăng ký xe mới biển số ${plate_number}. Vui lòng phê duyệt.`,
        "VEHICLE_APPROVAL_REQUEST"
      );
    }

    if (req.user) {
      await logAudit(
        req.user.user_id,
        req.user.username,
        "CREATE",
        "vehicle",
        plate_number,
        null,
        { plate_number, resident_id, type_id, color, status: 'active' },
        `Admin đăng ký xe mới: ${plate_number} (Chủ xe: ${resident ? resident.name : resident_id})`,
        req.ip
      );
    }

    res.status(201).json({ message: "Thêm xe thành công" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Biển số xe đã tồn tại" });
    }
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// PUT /api/vehicles/:plate_number
const updateVehicle = async (req, res) => {
  const { plate_number } = req.params;
  const { resident_id, type_id, color } = req.body;
  try {
    // 1. Kiểm tra xe có đang trong bãi không
    const [activeSessions] = await db.query(
      `SELECT * FROM parking_session WHERE plate_number = ? AND status = 'parking'`,
      [plate_number]
    );
    if (activeSessions.length > 0) {
      return res.status(400).json({ message: "Không thể cập nhật thông tin vì xe đang đỗ trong bãi. Vui lòng check-out xe trước." });
    }

    const [[oldVehicle]] = await db.query(
      `SELECT resident_id, type_id, color FROM vehicles WHERE plate_number = ?`,
      [plate_number]
    );

    await db.query(
      `UPDATE vehicles SET resident_id=?, type_id=?, color=? WHERE plate_number=?`,
      [resident_id, type_id, color, plate_number]
    );

    if (req.user) {
      await logAudit(
        req.user.user_id,
        req.user.username,
        "UPDATE",
        "vehicle",
        plate_number,
        oldVehicle || null,
        { resident_id, type_id, color },
        `Cập nhật thông tin xe: ${plate_number}`,
        req.ip
      );
    }

    res.json({ message: "Cập nhật thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// DELETE /api/vehicles/:plate_number
const deleteVehicle = async (req, res) => {
  const { plate_number } = req.params;
  try {
    // 0. Kiểm tra xe có đang trong bãi không
    const [activeSessions] = await db.query(
      `SELECT * FROM parking_session WHERE plate_number = ? AND status = 'parking'`,
      [plate_number]
    );
    if (activeSessions.length > 0) {
      return res.status(400).json({ message: "Không thể xóa xe vì xe đang đỗ trong bãi. Vui lòng check-out xe trước." });
    }

    // 1. Lấy thông tin user_id của cư dân sở hữu xe trước khi xóa
    const [[vehicleInfo]] = await db.query(
      `SELECT r.user_id FROM vehicles v 
       JOIN residents r ON v.resident_id = r.resident_id 
       WHERE v.plate_number = ?`, [plate_number]
    );

    // 2. Thực hiện xóa mềm
    await db.query(`UPDATE vehicles SET status = 'deleted' WHERE plate_number=?`, [plate_number]);

    // 3. Gửi thông báo cho cư dân
    if (vehicleInfo && vehicleInfo.user_id) {
      await NotificationService.notifyUser(
        vehicleInfo.user_id,
        "Thông báo xóa xe thành công",
        `Xe biển số ${plate_number} của bạn đã được xóa khỏi hệ thống bởi Admin.`,
        "VEHICLE_DELETED"
      );
    }

    if (req.user) {
      await logAudit(
        req.user.user_id,
        req.user.username,
        "DELETE",
        "vehicle",
        plate_number,
        { status: 'active' },
        { status: 'deleted' },
        `Xóa xe khỏi hệ thống: ${plate_number}`,
        req.ip
      );
    }

    res.json({ message: "Xóa xe thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// GET /api/vehicles/types
const getVehicleTypes = async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM vehicle_types`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// GET /api/vehicles/pending
const getPendingVehicles = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT v.plate_number, v.color, r.name as resident_name, r.apartment_number, vt.type_name, v.resident_id, v.type_id
       FROM vehicles v
       LEFT JOIN residents r ON v.resident_id = r.resident_id
       LEFT JOIN vehicle_types vt ON v.type_id = vt.type_id
       WHERE v.status = 'pending'
       ORDER BY v.plate_number ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// PUT /api/vehicles/:plate_number/approve
const approveVehicle = async (req, res) => {
  const { plate_number } = req.params;
  try {
    // 1. Lấy thông tin user_id của chủ xe trước khi cập nhật
    const [[vehicleInfo]] = await db.query(
      `SELECT r.user_id FROM vehicles v 
       JOIN residents r ON v.resident_id = r.resident_id 
       WHERE v.plate_number = ?`, [plate_number]
    );

    // 2. Cập nhật trạng thái
    const [rows] = await db.query(`UPDATE vehicles SET status = 'active' WHERE plate_number = ?`, [plate_number]);
    if (rows.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy xe" });
    }

    // 3. Gửi thông báo cho cư dân
    if (vehicleInfo && vehicleInfo.user_id) {
      await NotificationService.notifyUser(
        vehicleInfo.user_id,
        "Kết quả duyệt đăng ký xe",
        `Yêu cầu đăng ký xe biển số ${plate_number} của bạn đã được CHẤP THUẬN.`,
        "VEHICLE_APPROVED"
      );
    }

    if (req.user) {
      await logAudit(
        req.user.user_id,
        req.user.username,
        "UPDATE",
        "vehicle",
        plate_number,
        { status: 'pending' },
        { status: 'active' },
        `Phê duyệt đăng ký xe: ${plate_number}`,
        req.ip
      );
    }

    res.json({ message: "Duyệt đăng ký xe thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// PUT /api/vehicles/:plate_number/reject
const rejectVehicle = async (req, res) => {
  const { plate_number } = req.params;
  try {
    // 1. Lấy thông tin user_id của chủ xe
    const [[vehicleInfo]] = await db.query(
      `SELECT r.user_id FROM vehicles v 
       JOIN residents r ON v.resident_id = r.resident_id 
       WHERE v.plate_number = ? AND v.status = 'pending'`, [plate_number]
    );

    // 2. Cập nhật trạng thái
    const [rows] = await db.query(`UPDATE vehicles SET status = 'deleted' WHERE plate_number = ? AND status = 'pending'`, [plate_number]);
    if (rows.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy xe hoặc xe không ở trạng thái chờ duyệt" });
    }

    // 3. Gửi thông báo cho cư dân
    if (vehicleInfo && vehicleInfo.user_id) {
      await NotificationService.notifyUser(
        vehicleInfo.user_id,
        "Kết quả duyệt đăng ký xe",
        `Yêu cầu đăng ký xe biển số ${plate_number} của bạn đã bị TỪ CHỐI. Vui lòng liên hệ ban quản lý để biết thêm chi tiết.`,
        "VEHICLE_REJECTED"
      );
    }

    if (req.user) {
      await logAudit(
        req.user.user_id,
        req.user.username,
        "UPDATE",
        "vehicle",
        plate_number,
        { status: 'pending' },
        { status: 'deleted' },
        `Từ chối đăng ký xe: ${plate_number}`,
        req.ip
      );
    }

    res.json({ message: "Từ chối đăng ký xe thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = {
  getAllVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleTypes,
  getPendingVehicles,
  approveVehicle,
  rejectVehicle
};
