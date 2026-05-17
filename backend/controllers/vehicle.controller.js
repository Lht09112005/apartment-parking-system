const db = require("../config/db");

// GET /api/vehicles
const getAllVehicles = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT v.plate_number, v.color, r.name as resident_name, r.apartment_number, vt.type_name, v.resident_id, v.type_id, v.status
       FROM vehicles v
       LEFT JOIN residents r ON v.resident_id = r.resident_id
       LEFT JOIN vehicle_types vt ON v.type_id = vt.type_id
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

    // Tự động đăng ký vé tháng cho xe mới
    const [areas] = await db.query(`SELECT area_id FROM parking_area WHERE type_id = ? LIMIT 1`, [type_id]);
    const area_id = areas.length > 0 ? areas[0].area_id : null;

    if (area_id) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1); // Cấp mặc định 1 năm
      
      await db.query(
        `INSERT INTO monthly_parking (plate_number, area_id, start_date, end_date, status) VALUES (?, ?, ?, ?, 'active')`,
        [plate_number, area_id, startDate, endDate]
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
    await db.query(
      `UPDATE vehicles SET resident_id=?, type_id=?, color=? WHERE plate_number=?`,
      [resident_id, type_id, color, plate_number]
    );
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
    await db.query(`DELETE FROM vehicles WHERE plate_number=?`, [plate_number]);
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
    const [rows] = await db.query(`UPDATE vehicles SET status = 'active' WHERE plate_number = ?`, [plate_number]);
    if (rows.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy xe" });
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
    const [rows] = await db.query(`DELETE FROM vehicles WHERE plate_number = ? AND status = 'pending'`, [plate_number]);
    if (rows.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy xe hoặc xe không ở trạng thái chờ duyệt" });
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
