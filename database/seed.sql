USE parking_db;

INSERT INTO
    roles (role_id, role_name)
VALUES (1, 'Super Admin'),
    (2, 'Admin'),
    (3, 'Security'),
    (4, 'Resident');

INSERT INTO
    vehicle_types (type_id, type_name)
VALUES (1, 'Xe máy'),
    (2, 'Ô tô'),
    (3, 'Xe điện');

INSERT INTO
    users (
        username,
        password,
        role_id,
        status
    )
VALUES (
        'superadmin',
        '$2b$10$B4Sx4pi/0IVLnLp4E/Mt5eNUCA1vczBDWtMu7RYftuQZlDLv/asWa',
        1,
        'active'
    ),
    (
        'admin',
        '$2b$10$B4Sx4pi/0IVLnLp4E/Mt5eNUCA1vczBDWtMu7RYftuQZlDLv/asWa',
        2,
        'active'
    ),
    (
        'security',
        '$2b$10$B4Sx4pi/0IVLnLp4E/Mt5eNUCA1vczBDWtMu7RYftuQZlDLv/asWa',
        3,
        'active'
    ),
    (
        'resident',
        '$2b$10$B4Sx4pi/0IVLnLp4E/Mt5eNUCA1vczBDWtMu7RYftuQZlDLv/asWa',
        4,
        'active'
    ),
    (
        'resident2',
        '$2b$10$B4Sx4pi/0IVLnLp4E/Mt5eNUCA1vczBDWtMu7RYftuQZlDLv/asWa',
        4,
        'active'
    ),
    (
        'resident3',
        '$2b$10$B4Sx4pi/0IVLnLp4E/Mt5eNUCA1vczBDWtMu7RYftuQZlDLv/asWa',
        4,
        'active'
    ),
    (
        'resident4',
        '$2b$10$B4Sx4pi/0IVLnLp4E/Mt5eNUCA1vczBDWtMu7RYftuQZlDLv/asWa',
        4,
        'active'
    );

INSERT INTO
    security (user_id, name, phone)
VALUES (
        3,
        'Nguyễn Bảo Vệ',
        '0901234567'
    );

INSERT INTO
    residents (
        user_id,
        name,
        apartment_number,
        phone,
        email
    )
VALUES (
        4,
        'Trần Văn An',
        'A101',
        '0912345678',
        'an@email.com'
    ),
    (
        5,
        'Lê Thị Bình',
        'B202',
        '0923456789',
        'binh@email.com'
    ),
    (
        6,
        'Phạm Quang Dũng',
        'C303',
        '0934567890',
        'dungpq@email.com'
    ),
    (
        7,
        'Nguyễn Mai Anh',
        'A405',
        '0945678901',
        'maianh@email.com'
    );

INSERT INTO
    parking_area (
        area_name,
        type_id,
        capacity,
        available_slots
    )
VALUES (
        'Tầng hầm B1 - Xe máy',
        1,
        100,
        95
    ),
    (
        'Tầng hầm B2 - Ô tô',
        2,
        50,
        48
    ),
    (
        'Tầng trệt - Xe điện',
        3,
        30,
        29
    );

INSERT INTO
    parking_fee (
        type_id,
        price_per_hour,
        monthly_fee
    )
VALUES (1, 5000.00, 200000.00),
    (2, 10000.00, 500000.00),
    (3, 2000.00, 100000.00);

INSERT INTO
    vehicles (
        plate_number,
        resident_id,
        type_id,
        color,
        status
    )
VALUES ('29A-12345', 1, 1, 'Đỏ', 'active'),
    ('30B-67890', 2, 2, 'Trắng', 'active'),
    ('51F-99999', 3, 2, 'Đen', 'active'),
    ('59M1-11111', 3, 1, 'Xanh', 'active'),
    ('60C-88888', 4, 1, 'Xám', 'active'),
    ('99A-88888', 1, 2, 'Vàng', 'pending');

INSERT INTO
    monthly_parking (
        plate_number,
        area_id,
        start_date,
        end_date,
        status
    )
VALUES (
        '29A-12345',
        1,
        '2024-01-01',
        '2027-12-31',
        'active'
    ),
    (
        '30B-67890',
        2,
        '2024-03-01',
        '2027-12-31',
        'active'
    ),
    (
        '51F-99999',
        2,
        '2024-05-01',
        '2027-12-31',
        'active'
    ),
    (
        '59M1-11111',
        1,
        '2023-01-01',
        '2023-12-31',
        'expired'
    );

INSERT INTO
    parking_session (
        plate_number,
        guest_plate,
        type_id,
        time_in,
        time_out,
        status,
        staff_id
    )
VALUES (
        '29A-12345',
        NULL,
        1,
        DATE_SUB(NOW(), INTERVAL 5 HOUR),
        DATE_SUB(NOW(), INTERVAL 1 HOUR),
        'completed',
        1
    ),
    (
        '30B-67890',
        NULL,
        2,
        DATE_SUB(NOW(), INTERVAL 2 HOUR),
        NULL,
        'parking',
        1
    ),
    (
        NULL,
        '99Z-55555',
        1,
        DATE_SUB(NOW(), INTERVAL 10 HOUR),
        DATE_SUB(NOW(), INTERVAL 2 HOUR),
        'completed',
        1
    ),
    (
        '59M1-11111',
        NULL,
        1,
        DATE_SUB(NOW(), INTERVAL 30 MINUTE),
        NULL,
        'parking',
        1
    );