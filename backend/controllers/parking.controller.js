const db = require("../config/db");

// POST /api/parking/check-in
const checkIn = async (req, res) => {
  const { plate_number, type_id } = req.body;
  if (!plate_number) {
    return res.status(400).json({ message: "Vui lòng nhập biển số xe" });
  }

  try {
    // Removed: We now allow visitor vehicles to check in, so we don't enforce the vehicle to be in the 'vehicles' table.

    // Check if vehicle is already parking (check both resident and guest plates)
    const [activeSessions] = await db.query(
      `SELECT * FROM parking_session WHERE (plate_number = ? OR guest_plate = ?) AND status = 'parking'`,
      [plate_number, plate_number]
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
    const [vehicles] = await db.query(`SELECT plate_number, type_id FROM vehicles WHERE plate_number = ?`, [plate_number]);
    const isResident = vehicles.length > 0;

    if (isResident) {
      const residentTypeId = vehicles[0].type_id;
      await db.query(
        `INSERT INTO parking_session (plate_number, guest_plate, staff_id, time_in, status, type_id) VALUES (?, NULL, ?, NOW(), 'parking', ?)`,
        [plate_number, staff_id, residentTypeId]
      );
    } else {
      if (!type_id) {
        return res.status(400).json({ message: "Vui lòng chọn loại xe cho khách vãng lai" });
      }
      await db.query(
        `INSERT INTO parking_session (plate_number, guest_plate, staff_id, time_in, status, type_id) VALUES (NULL, ?, ?, NOW(), 'parking', ?)`,
        [plate_number, staff_id, type_id]
      );
    }

    res.status(200).json({ message: "Check-in thành công" });
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
       LEFT JOIN vehicles v ON s.plate_number = v.plate_number
       WHERE (s.plate_number = ? OR s.guest_plate = ?) AND s.status = 'parking'`,
      [plate_number, plate_number]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy phiên gửi xe hoặc xe đã check-out" });
    }

    const session = sessions[0];
    const isResident = !!session.is_resident;
    
    // Get base price from database based on vehicle type
    const [fees] = await db.query(`SELECT price_per_hour FROM parking_fee WHERE type_id = ?`, [session.session_type_id]);
    let price_per_hour = fees.length > 0 ? parseFloat(fees[0].price_per_hour) : 0;
    
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
        price_per_hour = 0; // Cư dân có vé tháng thì miễn phí
      }
    }

    // Calculate time out and duration
    const timeOut = new Date();
    const timeIn = new Date(session.time_in);
    const durationHours = Math.ceil((timeOut - timeIn) / (1000 * 60 * 60)); // Round up to nearest hour
    const calculatedHours = durationHours > 0 ? durationHours : 1; // Minimum 1 hour
    
    let totalFee = calculatedHours * price_per_hour;
    if (isMonthly) {
      totalFee = 0;
    }

    // Update session
    await db.query(
      `UPDATE parking_session SET time_out = NOW(), status = 'completed' WHERE session_id = ?`,
      [session.session_id]
    );

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
          `SELECT s.session_id, IFNULL(s.plate_number, s.guest_plate) as plate_number, s.time_in, s.time_out, s.status, sec.name as security_name
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
      `SELECT pf.type_id, vt.type_name, pf.price_per_hour, pf.monthly_fee
       FROM parking_fee pf
       JOIN vehicle_types vt ON pf.type_id = vt.type_id`
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
           COUNT(CASE WHEN s.status = 'completed' AND DATE(s.time_out) = CURDATE() THEN 1 END) as completedCheckouts,
           SUM(CASE
               WHEN m.monthly_id IS NOT NULL THEN 0
               ELSE GREATEST(CEIL(TIME_TO_SEC(TIMEDIFF(s.time_out, s.time_in))/3600), 1) * pf.price_per_hour
             END) as totalRevenue
         FROM parking_session s
         LEFT JOIN vehicles v ON s.plate_number = v.plate_number
         LEFT JOIN parking_fee pf ON COALESCE(s.type_id, v.type_id) = pf.type_id
         LEFT JOIN monthly_parking m ON v.plate_number = m.plate_number
            AND m.status = 'active'
            AND m.start_date <= CURDATE()
            AND m.end_date >= CURDATE()`
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

module.exports = { checkIn, checkOut, getAllSessions, getFeeConfig, getFinancialSummary };
