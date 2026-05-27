CREATE DATABASE IF NOT EXISTS parking_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE parking_db;

CREATE TABLE roles (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL
);

CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles (role_id)
);

CREATE TABLE vehicle_types (
    type_id INT PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL
);

CREATE TABLE residents (
    resident_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    name VARCHAR(100),
    apartment_number VARCHAR(20),
    phone VARCHAR(15),
    email VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users (user_id)
);

CREATE TABLE security (
    staff_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    name VARCHAR(100),
    phone VARCHAR(15),
    FOREIGN KEY (user_id) REFERENCES users (user_id)
);

CREATE TABLE vehicles (
    plate_number VARCHAR(15) PRIMARY KEY,
    resident_id INT,
    type_id INT,
    color VARCHAR(30),
    status VARCHAR(20) DEFAULT 'pending',
    FOREIGN KEY (resident_id) REFERENCES residents (resident_id),
    FOREIGN KEY (type_id) REFERENCES vehicle_types (type_id)
);

CREATE TABLE parking_area (
    area_id INT PRIMARY KEY AUTO_INCREMENT,
    area_name VARCHAR(50),
    type_id INT,
    capacity INT,
    available_slots INT,
    FOREIGN KEY (type_id) REFERENCES vehicle_types (type_id)
);

CREATE TABLE parking_fee (
    type_id INT PRIMARY KEY,
    monthly_fee DECIMAL(12, 2),
    block_hours INT DEFAULT 4,
    day_block_price DECIMAL(12, 2),
    night_block_price DECIMAL(12, 2),
    FOREIGN KEY (type_id) REFERENCES vehicle_types (type_id)
);

CREATE TABLE parking_session (
    session_id INT PRIMARY KEY AUTO_INCREMENT,
    plate_number VARCHAR(20) NOT NULL,
    staff_id INT,
    time_in TIMESTAMP NOT NULL,
    time_out TIMESTAMP,
    status VARCHAR(20) DEFAULT 'parking',
    fee_amount DECIMAL(12,2) DEFAULT 0,
    type_id INT,
    FOREIGN KEY (staff_id) REFERENCES security (staff_id),
    FOREIGN KEY (type_id) REFERENCES vehicle_types (type_id)
);

CREATE TABLE monthly_parking (
    monthly_id INT PRIMARY KEY AUTO_INCREMENT,
    plate_number VARCHAR(15),
    area_id INT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    FOREIGN KEY (plate_number) REFERENCES vehicles (plate_number),
    FOREIGN KEY (area_id) REFERENCES parking_area (area_id)
);