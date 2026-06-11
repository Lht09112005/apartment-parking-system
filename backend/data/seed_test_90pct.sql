USE parking_db;

-- ============================
-- 1. Đặt sức chứa = 10 cho cả 2 khu vực
-- ============================
UPDATE parking_area SET capacity = 10 WHERE type_id = 1; -- Xe máy
UPDATE parking_area SET capacity = 10 WHERE type_id = 2; -- Ô tô

-- ============================
-- 2. Thêm cư dân test nếu chưa có
-- ============================
INSERT IGNORE INTO users (user_id, username, password, role_id, status)
VALUES 
  (10, 'testres1', '$2b$10$B4Sx4pi/0IVLnLp4E/Mt5eNUCA1vczBDWtMu7RYftuQZlDLv/asWa', 4, 'active'),
  (11, 'testres2', '$2b$10$B4Sx4pi/0IVLnLp4E/Mt5eNUCA1vczBDWtMu7RYftuQZlDLv/asWa', 4, 'active'),
  (12, 'testres3', '$2b$10$B4Sx4pi/0IVLnLp4E/Mt5eNUCA1vczBDWtMu7RYftuQZlDLv/asWa', 4, 'active'),
  (13, 'testres4', '$2b$10$B4Sx4pi/0IVLnLp4E/Mt5eNUCA1vczBDWtMu7RYftuQZlDLv/asWa', 4, 'active'),
  (14, 'testres5', '$2b$10$B4Sx4pi/0IVLnLp4E/Mt5eNUCA1vczBDWtMu7RYftuQZlDLv/asWa', 4, 'active'),
  (15, 'testres6', '$2b$10$B4Sx4pi/0IVLnLp4E/Mt5eNUCA1vczBDWtMu7RYftuQZlDLv/asWa', 4, 'active'),
  (16, 'testres7', '$2b$10$B4Sx4pi/0IVLnLp4E/Mt5eNUCA1vczBDWtMu7RYftuQZlDLv/asWa', 4, 'active'),
  (17, 'testres8', '$2b$10$B4Sx4pi/0IVLnLp4E/Mt5eNUCA1vczBDWtMu7RYftuQZlDLv/asWa', 4, 'active');

INSERT IGNORE INTO residents (resident_id, user_id, name, apartment_number, phone, email)
VALUES
  (10, 10, 'Test Cư dân 1', 'D101', '0900000001', 'test1@email.com'),
  (11, 11, 'Test Cư dân 2', 'D102', '0900000002', 'test2@email.com'),
  (12, 12, 'Test Cư dân 3', 'D103', '0900000003', 'test3@email.com'),
  (13, 13, 'Test Cư dân 4', 'D201', '0900000004', 'test4@email.com'),
  (14, 14, 'Test Cư dân 5', 'D202', '0900000005', 'test5@email.com'),
  (15, 15, 'Test Cư dân 6', 'D203', '0900000006', 'test6@email.com'),
  (16, 16, 'Test Cư dân 7', 'D301', '0900000007', 'test7@email.com'),
  (17, 17, 'Test Cư dân 8', 'D302', '0900000008', 'test8@email.com');

-- ============================
-- 3. Thêm xe test - XE MÁY (type_id=1)
-- ============================
INSERT IGNORE INTO vehicles (plate_number, resident_id, type_id, color, status) VALUES
  ('50M1-00001', 10, 1, 'Đen', 'active'),
  ('50M1-00002', 10, 1, 'Trắng', 'active'),
  ('50M1-00003', 11, 1, 'Đỏ', 'active'),
  ('50M1-00004', 11, 1, 'Xanh', 'active'),
  ('50M1-00005', 12, 1, 'Bạc', 'active'),
  ('50M1-00006', 12, 1, 'Vàng', 'active'),
  ('50M1-00007', 13, 1, 'Đen', 'active');

-- ============================
-- 4. Thêm xe test - Ô TÔ (type_id=2)
-- ============================
INSERT IGNORE INTO vehicles (plate_number, resident_id, type_id, color, status) VALUES
  ('50A-10001', 14, 2, 'Trắng', 'active'),
  ('50A-10002', 14, 2, 'Đen', 'active'),
  ('50A-10003', 15, 2, 'Đỏ', 'active'),
  ('50A-10004', 15, 2, 'Bạc', 'active'),
  ('50A-10005', 16, 2, 'Xanh', 'active'),
  ('50A-10006', 16, 2, 'Vàng', 'active'),
  ('50A-10007', 17, 2, 'Đen', 'active');

-- ============================
-- 5. Đăng ký vé tháng cho xe máy - 7 xe (area_id=1 = Xe máy)
-- ============================
INSERT IGNORE INTO monthly_parking (plate_number, area_id, start_date, end_date, status) VALUES
  ('50M1-00001', 1, '2026-01-01', '2026-12-31', 'active'),
  ('50M1-00002', 1, '2026-01-01', '2026-12-31', 'active'),
  ('50M1-00003', 1, '2026-01-01', '2026-12-31', 'active'),
  ('50M1-00004', 1, '2026-01-01', '2026-12-31', 'active'),
  ('50M1-00005', 1, '2026-01-01', '2026-12-31', 'active'),
  ('50M1-00006', 1, '2026-01-01', '2026-12-31', 'active'),
  ('50M1-00007', 1, '2026-01-01', '2026-12-31', 'active');

-- ============================
-- 6. Đăng ký vé tháng cho ô tô - 7 xe (area_id=2 = Ô tô)
-- ============================
INSERT IGNORE INTO monthly_parking (plate_number, area_id, start_date, end_date, status) VALUES
  ('50A-10001', 2, '2026-01-01', '2026-12-31', 'active'),
  ('50A-10002', 2, '2026-01-01', '2026-12-31', 'active'),
  ('50A-10003', 2, '2026-01-01', '2026-12-31', 'active'),
  ('50A-10004', 2, '2026-01-01', '2026-12-31', 'active'),
  ('50A-10005', 2, '2026-01-01', '2026-12-31', 'active'),
  ('50A-10006', 2, '2026-01-01', '2026-12-31', 'active'),
  ('50A-10007', 2, '2026-01-01', '2026-12-31', 'active');

-- ============================
-- 7. Thêm 2 xe vãng lai đang đỗ mỗi loại (tổng = 7 tháng + 2 vãng lai = 9/10)
-- ============================
INSERT INTO parking_session (plate_number, type_id, time_in, status, staff_id) VALUES
  ('99VL-00001', 1, DATE_SUB(NOW(), INTERVAL 3 HOUR), 'parking', 1),
  ('99VL-00002', 1, DATE_SUB(NOW(), INTERVAL 1 HOUR), 'parking', 1);

INSERT INTO parking_session (plate_number, type_id, time_in, status, staff_id) VALUES
  ('99VL-00003', 2, DATE_SUB(NOW(), INTERVAL 2 HOUR), 'parking', 1),
  ('99VL-00004', 2, DATE_SUB(NOW(), INTERVAL 30 MINUTE), 'parking', 1);

-- Kết quả:
-- Xe máy: 7 vé tháng + 2 vãng lai đang đỗ = 9/10 (90%) → SẮP ĐẦY
-- Ô tô:   7 vé tháng + 2 vãng lai đang đỗ = 9/10 (90%) → SẮP ĐẦY
