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
        'resident1',
        '$2b$10$B4Sx4pi/0IVLnLp4E/Mt5eNUCA1vczBDWtMu7RYftuQZlDLv/asWa',
        4,
        'active'
    ),
    (
        'resident2',
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
        100
    ),
    (
        'Tầng hầm B2 - Ô tô',
        2,
        50,
        50
    ),
    (
        'Tầng trệt - Xe điện',
        3,
        30,
        30
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
        color
    )
VALUES ('29A-12345', 1, 1, 'Đỏ'),
    ('30B-67890', 2, 2, 'Trắng');

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
        '2024-12-31',
        'active'
    ),
    (
        '30B-67890',
        2,
        '2024-03-01',
        '2024-09-01',
        'active'
    );