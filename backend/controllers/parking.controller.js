const db = require("../config/db");
const { logAudit } = require("../utils/auditLogger");
const NotificationService = require("../services/notification.service");

// POST /api/parking/check-in
const checkIn = async (req, res) => {
  const { plate_number, type_id } = req.body;
  if (!plate_number) {
    return res.status(400).json({ message: "Vui lòng nhập biển số xe" });
  }

  try {
    // Removed: We now allow visitor vehicles to check in, so we don't enforce the vehicle to be in the 'vehicles' table.

    // Check if vehicle is already parking
    const [activeSessions] = await db.query(
      `SELECT * FROM parking_session WHERE plate_number = ? AND status = 'parking'`,
      [plate_number]
    );
    if (activeSessions.length > 0) {
      return res.status(400).json({ message: "Xe đang được gửi trong bãi" });
    }

    // Get staff_id from token
    let staff_id = null;
    if (req.user && req.user.user_id) {
      const [staffs] = await db.query(`SELECT staff_id FROM security WHERE user_id = ?`, [req.user.user_id]);
      if (staffs.length > 0) {
        staff_id = staffs[0].staff_id;
      }
    }

    // Check if resident vehicle
    const [vehicles] = await db.query(`SELECT plate_number, type_id, status FROM vehicles WHERE plate_number = ? AND status != 'deleted'`, [plate_number]);
    const isResident = vehicles.length > 0;
    const isPending = isResident && vehicles[0].status === 'pending';
    
    let warning = null;
    let finalTypeId = type_id;

    if (isResident && !isPending) {
      finalTypeId = vehicles[0].type_id;
    } else {
      if (!finalTypeId) {
        return res.status(400).json({ message: "Vui lòng chọn loại xe cho khách vãng lai" });
      }
      if (isPending) {
        warning = "Xe chưa được duyệt, tạm thời thu phí vãng lai";
      }
    }

    // Kiểm tra dung lượng bãi đỗ TRƯỚC khi cho xe vào
    try {
      const [[area]] = await db.query(
        `SELECT area_name, capacity FROM parking_area WHERE type_id = ? LIMIT 1`,
        [finalTypeId]
      );
      if (area && area.capacity > 0) {
        const [[{ occupied }]] = await db.query(
          `SELECT COUNT(*) as occupied FROM parking_session WHERE status = 'parking' AND type_id = ?`,
          [finalTypeId]
        );
        
        if (occupied >= area.capacity) {
            return res.status(400).json({ message: `Khu vực ${area.area_name} đã hết chỗ (${occupied}/${area.capacity}). Không thể nhận thêm xe.` });
        }

        const percent = Math.round(((occupied + 1) / area.capacity) * 100);
        if (percent >= 90) {
          await NotificationService.notifyRole(
            [3], 
            "Cảnh báo bãi đỗ xe sắp đầy", 
            `Khu vực ${area.area_name} đã đạt ${percent}% sức chứa (${occupied + 1}/${area.capacity}).`, 
            "PARKING_FULL_WARNING"
          );
        }
      } else {
        // Fallback kiểm tra tổng dung lượng nếu không tìm thấy cấu hình khu vực
        const [[{ total_parking }]] = await db.query(`SELECT COUNT(*) as total_parking FROM parking_session WHERE status = 'parking'`);
        const MAX_CAPACITY = 500;
        
        if (total_parking >= MAX_CAPACITY) {
            return res.status(400).json({ message: `Bãi đỗ xe đã hết chỗ (${total_parking}/${MAX_CAPACITY}). Không thể nhận thêm xe.` });
        }

        const percent = Math.round(((total_parking + 1)/MAX_CAPACITY)*100);
        if (percent >= 90) {
          await NotificationService.notifyRole(
            [3], 
            "Cảnh báo bãi đỗ xe sắp đầy", 
            `Khu vực đỗ xe đã đạt ${percent}% sức chứa (${total_parking + 1}/${MAX_CAPACITY}).`, 
            "PARKING_FULL_WARNING"
          );
        }
      }
    } catch (areaErr) {
      console.error("Lỗi kiểm tra dung lượng bãi đỗ:", areaErr);
    }

    await db.query(
      `INSERT INTO parking_session (plate_number, staff_id, time_in, status, type_id) VALUES (?, ?, NOW(), 'parking', ?)`,
      [plate_number, staff_id, finalTypeId]
    );
    
    // --- THÊM LOGIC THÔNG BÁO ---
    // 1. Thông báo cho cư dân xe đã check-in
    if (isResident) {
      const [[residentInfo]] = await db.query(
        `SELECT r.user_id FROM vehicles v 
         JOIN residents r ON v.resident_id = r.resident_id 
         WHERE v.plate_number = ?`, [plate_number]
      );
      if (residentInfo && residentInfo.user_id) {
        const timeStr = new Date().toLocaleString("vi-VN");
        await NotificationService.notifyUser(
          residentInfo.user_id,
          "Thông báo xe vào bãi",
          `Xe biển số ${plate_number} của bạn đã được CHECK-IN lúc ${timeStr}.`,
          "PARKING_CHECKIN"
        );
      }
    }
    res.status(200).json({ message: "Check-in thành công", warning });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// POST /api/parking/check-out
const checkOut = async (req, res) => {
  const { plate_number } = req.body;
  if (!plate_number) {
    return res.status(400).json({ message: "Vui lòng nhập biển số xe" });
  }

  try {
    // Find active session and check if resident
    const [sessions] = await db.query(
      `SELECT s.*, v.plate_number as is_resident, IFNULL(v.type_id, s.type_id) as session_type_id 
       FROM parking_session s
       LEFT JOIN vehicles v ON s.plate_number = v.plate_number AND v.status != 'deleted' AND v.status != 'pending'
       WHERE s.plate_number = ? AND s.status = 'parking'`,
      [plate_number]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy phiên gửi xe hoặc xe đã check-out" });
    }

    const session = sessions[0];
    const isResident = !!session.is_resident;
    
    // Get base price from database based on vehicle type
    const [fees] = await db.query(
      `SELECT block_hours, day_block_price, night_block_price FROM parking_fee WHERE type_id = ?`, 
      [session.session_type_id]
    );
    let day_block_price = 0;
    let night_block_price = 0;
    let block_hours = 4;

    if (fees.length > 0) {
      day_block_price = parseFloat(fees[0].day_block_price);
      night_block_price = parseFloat(fees[0].night_block_price);
      block_hours = parseInt(fees[0].block_hours) || 4;
    }
    
    let isMonthly = false;

    if (isResident) {
      // Check monthly registration
      const [monthly] = await db.query(
        `SELECT * FROM monthly_parking 
         WHERE plate_number = ? AND status = 'active' 
         AND start_date <= CURDATE() AND end_date >= CURDATE()`,
        [plate_number]
      );
      if (monthly.length > 0) {
        isMonthly = true;
      }
    }

    // Calculate time out and duration
    const timeOut = new Date();
    const timeIn = new Date(session.time_in);
    let totalFee = 0;
    let blocksCount = 0;

    if (isMonthly) {
      totalFee = 0;
      const durationHours = Math.ceil((timeOut - timeIn) / (1000 * 60 * 60));
      blocksCount = durationHours > 0 ? Math.ceil(durationHours / block_hours) : 1; 
    } else {
      let currentTime = new Date(timeIn);
      while (currentTime < timeOut) {
        blocksCount++;
        const currentHour = currentTime.getHours();
        const isDayTime = currentHour >= 6 && currentHour < 18;
        
        if (isDayTime) {
          totalFee += day_block_price;
        } else {
          totalFee += night_block_price;
        }
        
        // Add block_hours to current time
        currentTime.setHours(currentTime.getHours() + block_hours);
      }
    }
    
    let calculatedHours = blocksCount * block_hours;

    // Update session
    await db.query(
      `UPDATE parking_session SET time_out = NOW(), status = 'completed', fee_amount = ? WHERE session_id = ?`,
      [totalFee, session.session_id]
    );
    if (isResident) {
      const [[residentInfo]] = await db.query(
        `SELECT r.user_id FROM vehicles v 
         JOIN residents r ON v.resident_id = r.resident_id 
         WHERE v.plate_number = ?`, [plate_number]
      );
      if (residentInfo && residentInfo.user_id) {
        const timeStr = timeOut.toLocaleString("vi-VN");
        const feeStr = totalFee.toLocaleString("vi-VN");
        await NotificationService.notifyUser(
          residentInfo.user_id,
          "Thông báo xe ra bãi",
          `Xe biển số ${plate_number} của bạn đã được CHECK-OUT lúc ${timeStr} (Phí: ${feeStr} VNĐ).`,
          "PARKING_CHECKOUT"
        );
      }
    }
    res.status(200).json({
      message: "Check-out thành công",
      fee: totalFee,
      time_in: timeIn,
      time_out: timeOut,
      duration_hours: calculatedHours,
      is_resident: isResident,
      is_monthly: isMonthly
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// GET /api/parking/sessions
const getAllSessions = async (req, res) => {
    try {
        const [rows] = await db.query(
          `SELECT s.session_id, s.plate_number, s.time_in, s.time_out, s.status, s.type_id, sec.name as security_name
           FROM parking_session s
           LEFT JOIN security sec ON s.staff_id = sec.staff_id
           ORDER BY s.time_in DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi server" });
    }
};

const getFeeConfig = async (req, res) => {
  try {
    const [fees] = await db.query(
      `SELECT pf.type_id, vt.type_name, pf.day_block_price, pf.night_block_price, pf.block_hours, pf.monthly_fee
       FROM parking_fee pf
       JOIN vehicle_types vt ON pf.type_id = vt.type_id
       WHERE vt.type_name != 'Xe điện'`
    );
    res.json(fees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const getFinancialSummary = async (req, res) => {
  try {
    const [[summary]] = await db.query(
      `SELECT
           COUNT(CASE WHEN status = 'completed' AND DATE(time_out) = CURDATE() THEN 1 END) as completedCheckouts,
           SUM(CASE WHEN status = 'completed' AND DATE(time_out) = CURDATE() THEN fee_amount ELSE 0 END) as totalRevenue
         FROM parking_session`
    );

    const [[{ activeParking }]] = await db.query(
      `SELECT COUNT(*) as activeParking FROM parking_session WHERE status = 'parking'`
    );

    res.json({
      completedCheckouts: summary.completedCheckouts || 0,
      totalRevenue: parseFloat(summary.totalRevenue || 0),
      activeParking: activeParking || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const updateFeeConfig = async (req, res) => {
  const { type_id, day_block_price, night_block_price, block_hours, monthly_fee } = req.body;
  try {
    await db.query(
      `UPDATE parking_fee SET day_block_price = ?, night_block_price = ?, block_hours = ?, monthly_fee = ? WHERE type_id = ?`,
      [day_block_price, night_block_price, block_hours, monthly_fee, type_id]
    );

    if (req.user) {
      await logAudit(
        req.user.user_id, 
        req.user.username, 
        "UPDATE", 
        "fee_config", 
        type_id, 
        null, 
        { day_block_price, night_block_price, block_hours, monthly_fee }, 
        `Cập nhật bảng giá cho loại xe ${type_id}`, 
        req.ip
      );
    }

    res.json({ message: "Cập nhật bảng giá thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const getMonthlyParking = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT m.*, v.resident_id, r.name as resident_name, r.apartment_number, vt.type_name
       FROM monthly_parking m
       JOIN vehicles v ON m.plate_number = v.plate_number
       JOIN residents r ON v.resident_id = r.resident_id
       JOIN vehicle_types vt ON v.type_id = vt.type_id
       ORDER BY m.monthly_id DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const updateMonthlyStatus = async (req, res) => {
  const { monthly_id } = req.params;
  const { status } = req.body;
  try {
    await db.query(`UPDATE monthly_parking SET status = ? WHERE monthly_id = ?`, [status, monthly_id]);
    
    const [[monthlyInfo]] = await db.query(
      `SELECT m.plate_number, m.end_date, r.user_id 
       FROM monthly_parking m
       JOIN vehicles v ON m.plate_number = v.plate_number
       JOIN residents r ON v.resident_id = r.resident_id
       WHERE m.monthly_id = ?`, [monthly_id]
    );

    if (monthlyInfo && monthlyInfo.user_id) {
      const plateNumber = monthlyInfo.plate_number;
      let notifContent = `Đơn đăng ký vé tháng cho xe biển số ${plateNumber} đã bị TỪ CHỐI hoặc HỦY.`;
      
      if (status === 'active') {
        const endDateStr = new Date(monthlyInfo.end_date).toLocaleDateString("vi-VN");
        notifContent = `Đơn đăng ký vé tháng cho xe biển số ${plateNumber} đã được CHẤP THUẬN (Thời hạn: ${endDateStr}).`;
      }

      await NotificationService.notifyUser(
        monthlyInfo.user_id,
        "Kết quả duyệt vé tháng",
        notifContent,
        "MONTHLY_STATUS_UPDATED"
      );
    }


    res.json({ message: "Cập nhật trạng thái vé tháng thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = { 
  checkIn, 
  checkOut, 
  getAllSessions, 
  getFeeConfig, 
  updateFeeConfig,
  getMonthlyParking,
  updateMonthlyStatus,
  getFinancialSummary 
};
