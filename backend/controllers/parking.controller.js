const db = require("../config/db");
const { logAudit } = require("../utils/auditLogger");
const NotificationService = require("../services/notification.service");
const { normalizePlate } = require("../utils/plateNormalizer");

// POST /api/parking/check-in
const checkIn = async (req, res) => {
  let { plate_number, type_id } = req.body;
  plate_number = normalizePlate(plate_number);
  if (!plate_number) {
    return res.status(400).json({ message: "Vui lòng nhập biển số xe" });
  }

  try {
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

    // Only active vehicles in admin vehicle management are treated as resident vehicles.
    const [vehicles] = await db.query(`SELECT plate_number, type_id, status FROM vehicles WHERE plate_number = ? AND status = 'active'`, [plate_number]);
    const isResident = vehicles.length > 0;
    const [[pendingVehicle]] = await db.query(`SELECT status FROM vehicles WHERE plate_number = ? AND status = 'pending'`, [plate_number]);
    
    let warning = null;
    let finalTypeId = type_id;

    if (isResident) {
      finalTypeId = vehicles[0].type_id;
    } else {
      if (!finalTypeId) {
        return res.status(400).json({ message: "Vui lòng chọn loại xe cho khách vãng lai" });
      }
      if (pendingVehicle) {
        warning = "Xe chưa được duyệt, tạm thời thu phí vãng lai";
      }
    }

    // Kiểm tra dung lượng bãi đỗ TRƯỚC khi cho xe vào
    const [[configuredArea]] = await db.query(
      `SELECT area_id, area_name FROM parking_area WHERE type_id = ? LIMIT 1`,
      [finalTypeId]
    );
    if (!configuredArea) {
      return res.status(400).json({ message: "Loai xe nay chua co khu vuc do trong cau hinh cua Admin" });
    }

    try {
      const [[area]] = await db.query(
        `SELECT area_name, capacity FROM parking_area WHERE type_id = ? LIMIT 1`,
        [finalTypeId]
      );
      if (area && area.capacity > 0) {
        // 1. Kiểm tra xe này có vé tháng active không
        const [[monthly]] = await db.query(
          `SELECT * FROM monthly_parking WHERE plate_number = ? AND status = 'active' AND end_date >= CURDATE()`,
          [plate_number]
        );

        // 2. Đếm số lượng vé tháng active cho loại xe này (đã đặt chỗ sẵn)
        const [[{ monthly_count }]] = await db.query(
          `SELECT COUNT(DISTINCT mp.plate_number) as monthly_count 
           FROM monthly_parking mp
           JOIN vehicles v ON mp.plate_number = v.plate_number
           WHERE v.type_id = ? AND mp.status = 'active' AND mp.end_date >= CURDATE()`,
          [finalTypeId]
        );

        // 3. Đếm số lượng xe vãng lai đang đỗ thực tế (không có vé tháng)
        const [[{ visitor_count }]] = await db.query(
          `SELECT COUNT(*) as visitor_count FROM parking_session 
           WHERE status = 'parking' AND type_id = ?
           AND plate_number NOT IN (
             SELECT mp2.plate_number FROM monthly_parking mp2
             WHERE mp2.status = 'active' AND mp2.end_date >= CURDATE()
           )`,
          [finalTypeId]
        );

        const occupied = monthly_count + visitor_count;

        // Nếu đã hết chỗ trống và xe này KHÔNG phải là xe vé tháng, chặn không cho vào
        if (occupied >= area.capacity && !monthly) {
            await NotificationService.notifyRole(
              [3], 
              "Cảnh báo bãi đỗ xe ĐÃ ĐẦY", 
              `Khu vực ${area.area_name} đã ĐẦY sức chứa thiết lập (${occupied}/${area.capacity}). Không thể nhận thêm xe vãng lai.`, 
              "PARKING_FULL_WARNING"
            );
            return res.status(400).json({ message: `Khu vực ${area.area_name} đã hết chỗ cho khách vãng lai (${occupied}/${area.capacity}). Chỉ xe vé tháng được phép vào.` });
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
            await NotificationService.notifyRole(
              [3], 
              "Cảnh báo bãi đỗ xe ĐÃ ĐẦY", 
              `Bãi đỗ xe đã ĐẦY sức chứa (${total_parking}/${MAX_CAPACITY}). Không thể nhận thêm xe.`, 
              "PARKING_FULL_WARNING"
            );
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
  let { plate_number } = req.body;
  plate_number = normalizePlate(plate_number);
  if (!plate_number) {
    return res.status(400).json({ message: "Vui lòng nhập biển số xe" });
  }

  try {
    // Find active session and check if resident
    const [sessions] = await db.query(
      `SELECT s.*, v.plate_number as is_resident, IFNULL(v.type_id, s.type_id) as session_type_id 
       FROM parking_session s
       LEFT JOIN vehicles v ON s.plate_number = v.plate_number AND v.status = 'active'
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
        const { date_from, date_to, plate_number, type_id } = req.query;

        let conditions = [];
        let params = [];

        if (date_from) {
            conditions.push("DATE(s.time_in) >= ?");
            params.push(date_from);
        }
        if (date_to) {
            conditions.push("DATE(s.time_in) <= ?");
            params.push(date_to);
        }
        if (plate_number) {
            const normalizedPlate = normalizePlate(plate_number);
            if (normalizedPlate) {
                conditions.push("s.plate_number LIKE ?");
                params.push(`%${normalizedPlate}%`);
            }
        }
        if (type_id) {
            conditions.push("s.type_id = ?");
            params.push(type_id);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const [rows] = await db.query(
          `SELECT s.session_id, s.plate_number, s.time_in, s.time_out, s.status,
                  s.type_id, s.fee_amount,
                  vt.type_name,
                  sec.name as security_name
           FROM parking_session s
           LEFT JOIN security sec ON s.staff_id = sec.staff_id
           LEFT JOIN vehicle_types vt ON s.type_id = vt.type_id
           ${whereClause}
           ORDER BY s.time_in DESC
           LIMIT 500`,
          params
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
       WHERE vt.type_id IN (1, 2)`
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

const getDetailedRevenueReport = async (req, res) => {
  try {
    // 1. Short-term visitor revenue
    const [[shortTerm]] = await db.query(
      `SELECT IFNULL(SUM(fee_amount), 0) as totalShortTermRevenue, COUNT(*) as totalShortTermSessions
       FROM parking_session
       WHERE status = 'completed' AND fee_amount > 0`
    );

    // 2. Monthly card active revenue
    const [[monthly]] = await db.query(
      `SELECT IFNULL(SUM(pf.monthly_fee), 0) as totalMonthlyRevenue, COUNT(*) as totalMonthlyTickets
       FROM monthly_parking mp
       JOIN vehicles v ON mp.plate_number = v.plate_number
       JOIN parking_fee pf ON v.type_id = pf.type_id
       WHERE mp.status = 'active'`
    );

    // 3. Short term stats by vehicle type
    const [[motoShortTerm]] = await db.query(
      `SELECT IFNULL(SUM(fee_amount), 0) as revenue, COUNT(*) as count
       FROM parking_session
       WHERE status = 'completed' AND type_id = 1 AND fee_amount > 0`
    );

    const [[carShortTerm]] = await db.query(
      `SELECT IFNULL(SUM(fee_amount), 0) as revenue, COUNT(*) as count
       FROM parking_session
       WHERE status = 'completed' AND type_id = 2 AND fee_amount > 0`
    );

    // 4. Monthly ticket stats by vehicle type
    const [[motoMonthly]] = await db.query(
      `SELECT IFNULL(SUM(pf.monthly_fee), 0) as revenue, COUNT(*) as count
       FROM monthly_parking mp
       JOIN vehicles v ON mp.plate_number = v.plate_number
       JOIN parking_fee pf ON v.type_id = pf.type_id
       WHERE mp.status = 'active' AND v.type_id = 1`
    );

    const [[carMonthly]] = await db.query(
      `SELECT IFNULL(SUM(pf.monthly_fee), 0) as revenue, COUNT(*) as count
       FROM monthly_parking mp
       JOIN vehicles v ON mp.plate_number = v.plate_number
       JOIN parking_fee pf ON v.type_id = pf.type_id
       WHERE mp.status = 'active' AND v.type_id = 2`
    );

    // 5. Short term history by month
    const [shortTermHistory] = await db.query(
      `SELECT DATE_FORMAT(time_out, '%Y-%m') as month, IFNULL(SUM(fee_amount), 0) as shortTermRevenue
       FROM parking_session
       WHERE status = 'completed' AND time_out IS NOT NULL AND fee_amount > 0
       GROUP BY DATE_FORMAT(time_out, '%Y-%m')`
    );

    // 6. Monthly ticket history by month
    const [monthlyHistory] = await db.query(
      `SELECT DATE_FORMAT(mp.start_date, '%Y-%m') as month, IFNULL(SUM(pf.monthly_fee), 0) as monthlyRevenue
       FROM monthly_parking mp
       JOIN vehicles v ON mp.plate_number = v.plate_number
       JOIN parking_fee pf ON v.type_id = pf.type_id
       GROUP BY DATE_FORMAT(mp.start_date, '%Y-%m')`
    );

    // 7. Recent cash-outs
    const [recentTransactions] = await db.query(
      `SELECT s.session_id, s.plate_number, s.time_in, s.time_out, s.fee_amount, vt.type_name
       FROM parking_session s
       LEFT JOIN vehicle_types vt ON s.type_id = vt.type_id
       WHERE s.status = 'completed' AND s.fee_amount > 0
       AND NOT EXISTS (
         SELECT 1 FROM vehicles v
         WHERE v.plate_number = s.plate_number
         AND v.status = 'active'
       )
       ORDER BY s.time_out DESC
       LIMIT 10`
    );

    // 8. Recent active monthly cards
    const [recentMonthlyCards] = await db.query(
      `SELECT mp.monthly_id, mp.plate_number, mp.start_date, mp.end_date, pf.monthly_fee, vt.type_name, r.name as resident_name, r.apartment_number
       FROM monthly_parking mp
       JOIN vehicles v ON mp.plate_number = v.plate_number
       JOIN parking_fee pf ON v.type_id = pf.type_id
       JOIN vehicle_types vt ON v.type_id = vt.type_id
       JOIN residents r ON v.resident_id = r.resident_id
       WHERE mp.status = 'active'
       ORDER BY mp.start_date DESC
       LIMIT 10`
    );

    const [vehicleTypeRevenue] = await db.query(
      `SELECT vt.type_id, vt.type_name,
              IFNULL(st.revenue, 0) as shortTermRevenue,
              IFNULL(st.count, 0) as shortTermCount,
              IFNULL(mt.revenue, 0) as monthlyRevenue,
              IFNULL(mt.count, 0) as monthlyCount
       FROM vehicle_types vt
       LEFT JOIN (
         SELECT type_id, IFNULL(SUM(fee_amount), 0) as revenue, COUNT(*) as count
         FROM parking_session
         WHERE status = 'completed' AND fee_amount > 0
         GROUP BY type_id
       ) st ON st.type_id = vt.type_id
       LEFT JOIN (
         SELECT v.type_id, IFNULL(SUM(pf.monthly_fee), 0) as revenue, COUNT(*) as count
         FROM monthly_parking mp
         JOIN vehicles v ON mp.plate_number = v.plate_number
         JOIN parking_fee pf ON v.type_id = pf.type_id
         WHERE mp.status = 'active'
         GROUP BY v.type_id
       ) mt ON mt.type_id = vt.type_id
       WHERE EXISTS (SELECT 1 FROM parking_area pa WHERE pa.type_id = vt.type_id)
       ORDER BY vt.type_id`
    );

    res.json({
      summary: {
        totalShortTermRevenue: parseFloat(shortTerm.totalShortTermRevenue),
        totalShortTermSessions: parseInt(shortTerm.totalShortTermSessions),
        totalMonthlyRevenue: parseFloat(monthly.totalMonthlyRevenue),
        totalMonthlyTickets: parseInt(monthly.totalMonthlyTickets),
        totalRevenue: parseFloat(shortTerm.totalShortTermRevenue) + parseFloat(monthly.totalMonthlyRevenue)
      },
      byVehicleType: {
        motorcycle: {
          shortTermRevenue: parseFloat(motoShortTerm.revenue),
          shortTermCount: parseInt(motoShortTerm.count),
          monthlyRevenue: parseFloat(motoMonthly.revenue),
          monthlyCount: parseInt(motoMonthly.count),
          totalRevenue: parseFloat(motoShortTerm.revenue) + parseFloat(motoMonthly.revenue)
        },
        car: {
          shortTermRevenue: parseFloat(carShortTerm.revenue),
          shortTermCount: parseInt(carShortTerm.count),
          monthlyRevenue: parseFloat(carMonthly.revenue),
          monthlyCount: parseInt(carMonthly.count),
          totalRevenue: parseFloat(carShortTerm.revenue) + parseFloat(carMonthly.revenue)
        }
      },
      vehicleTypeRevenue: vehicleTypeRevenue.map((row) => ({
        ...row,
        shortTermRevenue: parseFloat(row.shortTermRevenue || 0),
        shortTermCount: parseInt(row.shortTermCount || 0),
        monthlyRevenue: parseFloat(row.monthlyRevenue || 0),
        monthlyCount: parseInt(row.monthlyCount || 0),
        totalRevenue: parseFloat(row.shortTermRevenue || 0) + parseFloat(row.monthlyRevenue || 0)
      })),
      history: {
        shortTerm: shortTermHistory,
        monthly: monthlyHistory
      },
      recentTransactions,
      recentMonthlyCards
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// GET /api/parking/areas — Lấy danh sách bãi đỗ xe và sức chứa
const getParkingAreas = async (req, res) => {
  try {
    const [areas] = await db.query(
      `SELECT pa.area_id, pa.area_name, pa.capacity, pa.available_slots,
              pa.type_id, vt.type_name,
              (SELECT COUNT(DISTINCT mp.plate_number) FROM monthly_parking mp
               JOIN vehicles v ON mp.plate_number = v.plate_number
               WHERE v.type_id = pa.type_id 
               AND mp.status = 'active'
               AND mp.end_date >= CURDATE()) as monthly_count,
              (SELECT COUNT(*) FROM parking_session ps
               WHERE ps.type_id = pa.type_id AND ps.status = 'parking'
               AND ps.plate_number NOT IN (
                 SELECT mp2.plate_number FROM monthly_parking mp2
                 WHERE mp2.status = 'active' AND mp2.end_date >= CURDATE()
               )) as visitor_parked_count
       FROM parking_area pa
       LEFT JOIN vehicle_types vt ON pa.type_id = vt.type_id
       ORDER BY pa.area_id`
    );
    // current_count = monthly reserved + visitor currently parked (non-monthly)
    const result = areas.map(a => ({
      ...a,
      current_count: (a.monthly_count || 0) + (a.visitor_parked_count || 0)
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// PUT /api/parking/areas/:area_id — Cập nhật sức chứa bãi đỗ xe
const updateParkingArea = async (req, res) => {
  const { area_id } = req.params;
  const { area_name, capacity } = req.body;

  if (!area_name || !capacity || capacity < 1) {
    return res.status(400).json({ message: "Tên bãi và sức chứa không hợp lệ" });
  }

  try {
    const [[oldArea]] = await db.query(`SELECT area_name, capacity FROM parking_area WHERE area_id = ?`, [area_id]);

    await db.query(
      `UPDATE parking_area SET area_name = ?, capacity = ? WHERE area_id = ?`,
      [area_name, capacity, area_id]
    );

    if (req.user) {
      await logAudit(
        req.user.user_id,
        req.user.username,
        "UPDATE",
        "parking_area",
        area_id,
        oldArea || null,
        { area_name, capacity },
        `Cập nhật sức chứa bãi đỗ xe ${area_name || (oldArea && oldArea.area_name)}: ${capacity} chỗ`,
        req.ip
      );
    }

    res.json({ message: "Cập nhật sức chứa bãi đỗ xe thành công" });
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
  getFinancialSummary,
  getDetailedRevenueReport,
  getParkingAreas,
  updateParkingArea
};
