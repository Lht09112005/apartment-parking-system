const db = require("./config/db");

async function generateData() {
  try {
    console.log("=== ĐANG KHỞI TẠO DỮ LIỆU DEMO THỰC TẾ ===");

    // 1. Dọn dẹp dữ liệu cũ (chỉ xóa những dữ liệu demo tự sinh, giữ lại admin/security gốc)
    console.log("1. Đang dọn dẹp các dữ liệu tự sinh cũ...");
    await db.query("DELETE FROM monthly_parking WHERE plate_number NOT IN ('29A12345', '30B67890', '51F99999', '59M111111')");
    await db.query("DELETE FROM parking_session WHERE plate_number NOT IN ('29A12345', '30B67890', '51F99999', '59M111111')");
    await db.query("DELETE FROM vehicles WHERE plate_number NOT IN ('29A12345', '30B67890', '51F99999', '59M111111', '60C88888', '99A88888')");
    
    // Tìm các resident_id tự sinh (lớn hơn 4 vì 4 cư dân đầu tiên là gốc)
    const [extraResidents] = await db.query("SELECT resident_id, user_id FROM residents WHERE resident_id > 4");
    if (extraResidents.length > 0) {
      const residentIds = extraResidents.map(r => r.resident_id);
      const userIds = extraResidents.map(r => r.user_id).filter(id => id !== null);
      
      await db.query("DELETE FROM residents WHERE resident_id IN (?)", [residentIds]);
      if (userIds.length > 0) {
        await db.query("DELETE FROM users WHERE user_id IN (?)", [userIds]);
      }
    }

    // 2. Tạo 50 cư dân mới bằng bộ sinh tên ngẫu nhiên
    console.log("2. Đang tạo 50 cư dân demo mới...");
    const familyNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"];
    const middleNames = ["Văn", "Thành", "Đức", "Quốc", "Hữu", "Hoàng", "Minh", "Thanh", "Thị", "Hồng", "Mai", "Ngọc", "Thu", "Tuyết", "Khánh"];
    const firstNames = ["An", "Bình", "Cường", "Dũng", "Giang", "Hương", "Huy", "Hải", "Hùng", "Hằng", "Hoa", "Linh", "Long", "Lan", "Minh", "Nam", "Phong", "Phúc", "Quân", "Quỳnh", "Sơn", "Tùng", "Thảo", "Trang", "Tuấn", "Vy", "Yến", "Tiến", "Kiệt", "Trâm"];

    const blocks = ["A1", "A2", "B1", "B2", "C1", "C2"];
    const passwordHash = "$2b$10$B4Sx4pi/0IVLnLp4E/Mt5eNUCA1vczBDWtMu7RYftuQZlDLv/asWa"; // '123456'

    const totalNewResidents = 50;

    for (let i = 0; i < totalNewResidents; i++) {
      const username = `cudan${i + 5}`; // cudan5 -> cudan54
      
      // Ghép tên ngẫu nhiên
      const fName = familyNames[Math.floor(Math.random() * familyNames.length)];
      const mName = middleNames[Math.floor(Math.random() * middleNames.length)];
      const lName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const name = `${fName} ${mName} ${lName}`;

      // Sinh căn hộ ngẫu nhiên dạng A1-0504
      const block = blocks[Math.floor(Math.random() * blocks.length)];
      const floor = Math.floor(2 + Math.random() * 15); // tầng 2 -> 16
      const room = Math.floor(1 + Math.random() * 12);  // phòng 1 -> 12
      const apartment = `${block}-${floor.toString().padStart(2, '0')}${room.toString().padStart(2, '0')}`;
      
      const phone = `098${Math.floor(1000000 + Math.random() * 9000000)}`;
      const email = `${username}@apartment.com`;

      // Thêm user
      const [userResult] = await db.query(
        "INSERT INTO users (username, password, role_id, status) VALUES (?, ?, 4, 'active')",
        [username, passwordHash]
      );
      const userId = userResult.insertId;

      // Thêm resident
      await db.query(
        "INSERT INTO residents (user_id, name, apartment_number, phone, email) VALUES (?, ?, ?, ?, ?)",
        [userId, name, apartment, phone, email]
      );
    }

    // Lấy danh sách các resident_id vừa tạo
    const [[{ min_res_id }]] = await db.query("SELECT MIN(resident_id) as min_res_id FROM residents WHERE resident_id > 4");
    const [[{ max_res_id }]] = await db.query("SELECT MAX(resident_id) as max_res_id FROM residents WHERE resident_id > 4");

    // 3. Tạo 70 xe cho cư dân
    console.log("3. Đang tạo 70 xe cư dân...");
    const platePrefixes = ["29", "30", "31", "34", "51", "59", "75", "43", "37", "36", "47", "72"];
    const colors = ["Đen", "Trắng", "Đỏ", "Xám", "Xanh", "Bạc", "Vàng", "Xanh Rêu", "Nâu"];

    const generatedPlates = [];
    const totalNewVehicles = 70;

    for (let i = 0; i < totalNewVehicles; i++) {
      const prefix = platePrefixes[Math.floor(Math.random() * platePrefixes.length)];
      const suffix = Math.floor(10000 + Math.random() * 90000); // 5 số
      const char = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // Chữ cái ngẫu nhiên
      const plate = `${prefix}${char}${suffix}`; // Ví dụ: 29A12345

      const residentId = Math.floor(min_res_id + Math.random() * (max_res_id - min_res_id + 1));
      const typeId = Math.random() > 0.4 ? 1 : 2; // 60% xe máy, 40% ô tô
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // Phân bổ trạng thái
      let status = "active";
      let rejectReason = null;
      if (i >= 65 && i < 68) {
        status = "pending";
      } else if (i >= 68) {
        status = "rejected";
        rejectReason = i === 68 ? "Ảnh đăng ký xe bị mờ" : "Biển số xe không khớp với giấy tờ đăng ký";
      }

      await db.query(
        "INSERT INTO vehicles (plate_number, resident_id, type_id, color, status, rejection_reason) VALUES (?, ?, ?, ?, ?, ?)",
        [plate, residentId, typeId, color, status, rejectReason]
      );

      if (status === "active") {
        generatedPlates.push({ plate, typeId });
      }
    }

    // 4. Đăng ký vé tháng cho 40 xe active
    console.log("4. Đang tạo 40 vé tháng hoạt động...");
    for (let i = 0; i < Math.min(40, generatedPlates.length); i++) {
      const { plate, typeId } = generatedPlates[i];
      const areaId = typeId === 1 ? 1 : 2; // 1: hầm xe máy, 2: hầm ô tô
      
      // Ngày bắt đầu cách đây 1 tháng, hết hạn sau 2 tháng nữa
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 2);

      await db.query(
        "INSERT INTO monthly_parking (plate_number, area_id, start_date, end_date, status) VALUES (?, ?, ?, ?, 'active')",
        [plate, areaId, startDate, endDate]
      );
    }

    // 5. Tạo 300 lượt đỗ xe lịch sử trong 30 ngày qua để vẽ biểu đồ doanh thu
    console.log("5. Đang tạo 300 lượt đỗ xe lịch sử để làm biểu đồ doanh thu...");
    const now = new Date();
    
    // Lấy staff_id của bảo vệ mặc định
    const [[securityStaff]] = await db.query("SELECT staff_id FROM security LIMIT 1");
    const staffId = securityStaff ? securityStaff.staff_id : 10; // staff_id của bảo vệ là 10

    const totalSessions = 300;

    for (let i = 0; i < totalSessions; i++) {
      const isMonthly = Math.random() > 0.45; // 55% lượt đỗ là xe tháng, 45% vãng lai
      let plate = "";
      let typeId = 1;

      if (isMonthly && generatedPlates.length > 0) {
        const randomActive = generatedPlates[Math.floor(Math.random() * generatedPlates.length)];
        plate = randomActive.plate;
        typeId = randomActive.typeId;
      } else {
        // Tạo biển số xe vãng lai ngẫu nhiên
        const prefix = platePrefixes[Math.floor(Math.random() * platePrefixes.length)];
        const suffix = Math.floor(10000 + Math.random() * 90000);
        const char = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        plate = `${prefix}${char}${suffix}`;
        typeId = Math.random() > 0.3 ? 1 : 2; // 70% xe máy vãng lai, 30% ô tô vãng lai
      }

      // Chọn ngẫu nhiên thời gian vào trong 30 ngày qua
      const daysAgo = Math.random() * 30;
      const timeIn = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      // Thời gian đỗ ngẫu nhiên từ 1 đến 12 giờ
      const durationHours = 1 + Math.random() * 11;
      const timeOut = new Date(timeIn.getTime() + durationHours * 60 * 60 * 1000);

      // Tính tiền cho xe vãng lai
      let feeAmount = 0;
      if (!isMonthly) {
        const blockHours = 4;
        const blocks = Math.ceil(durationHours / blockHours);
        
        // Giá block: xe máy 5k, ô tô 10k
        const pricePerBlock = typeId === 1 ? 5000 : 10000;
        feeAmount = blocks * pricePerBlock;
      }

      // Trạng thái phần lớn là completed, chỉ có 5 xe đang đỗ hiện tại
      const isCurrent = i >= 295;
      const status = isCurrent ? "parking" : "completed";
      const finalTimeOut = isCurrent ? null : timeOut;
      const finalFee = isCurrent ? 0 : feeAmount;

      await db.query(
        "INSERT INTO parking_session (plate_number, staff_id, time_in, time_out, status, fee_amount, type_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [plate, staffId, timeIn, finalTimeOut, status, finalFee, typeId]
      );
    }

    console.log("=== TẠO DỮ LIỆU DEMO THÀNH CÔNG! ===");
    process.exit(0);
  } catch (err) {
    console.error("Lỗi khi tạo dữ liệu demo:", err);
    process.exit(1);
  }
}

generateData();
