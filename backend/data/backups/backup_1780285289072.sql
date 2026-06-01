-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: parking_db
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `monthly_parking`
--

DROP TABLE IF EXISTS `monthly_parking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `monthly_parking` (
  `monthly_id` int NOT NULL AUTO_INCREMENT,
  `plate_number` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `area_id` int DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  PRIMARY KEY (`monthly_id`),
  KEY `plate_number` (`plate_number`),
  KEY `area_id` (`area_id`),
  CONSTRAINT `monthly_parking_ibfk_1` FOREIGN KEY (`plate_number`) REFERENCES `vehicles` (`plate_number`),
  CONSTRAINT `monthly_parking_ibfk_2` FOREIGN KEY (`area_id`) REFERENCES `parking_area` (`area_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `monthly_parking`
--

LOCK TABLES `monthly_parking` WRITE;
/*!40000 ALTER TABLE `monthly_parking` DISABLE KEYS */;
INSERT INTO `monthly_parking` VALUES (1,'29A-12345',1,'2024-01-01','2024-12-31','active'),(2,'30B-67890',2,'2024-03-01','2024-09-01','active'),(3,'51F-99999',2,'2024-05-01','2024-11-01','canceled'),(4,'59M1-11111',1,'2023-01-01','2023-12-31','expired'),(5,'99A-88888',2,'2026-04-25','2026-05-25','expired'),(6,'48AB-9999',1,'2026-05-02','2026-06-02','active'),(7,'29A-99999',1,'2026-05-30','2026-06-30','canceled'),(8,'99A-88888',2,'2026-05-30','2026-06-30','active'),(9,'48AB-9999',1,'2026-06-03','2026-07-03','active'),(10,'48AB-9999',1,'2026-07-04','2026-08-04','active');
/*!40000 ALTER TABLE `monthly_parking` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,1,'Yêu cầu duyệt đăng ký xe mới','Cư dân Trần Văn An (Căn hộ A101) đã đăng ký xe mới biển số 47A99999, loại xe Ô tô. Vui lòng phê duyệt.','VEHICLE_APPROVAL_REQUEST',1,'2026-05-30 14:34:22'),(2,2,'Yêu cầu duyệt đăng ký xe mới','Cư dân Trần Văn An (Căn hộ A101) đã đăng ký xe mới biển số 47A99999, loại xe Ô tô. Vui lòng phê duyệt.','VEHICLE_APPROVAL_REQUEST',1,'2026-05-30 14:34:22'),(3,4,'Vé tháng sắp hết hạn','Vé tháng của xe biển số 48AB-9999 sẽ hết hạn vào ngày 02/06/2026. Vui lòng gia hạn sớm.','TICKET_EXPIRING_WARNING',1,'2026-05-30 14:42:05'),(4,1,'Yêu cầu duyệt vé tháng','Cư dân Trần Văn An (Căn hộ A101) đã gửi yêu cầu đăng ký vé tháng cho xe biển số 99A-88888.','MONTHLY_APPROVAL_REQUEST',1,'2026-05-30 14:47:02'),(5,2,'Yêu cầu duyệt vé tháng','Cư dân Trần Văn An (Căn hộ A101) đã gửi yêu cầu đăng ký vé tháng cho xe biển số 99A-88888.','MONTHLY_APPROVAL_REQUEST',1,'2026-05-30 14:47:02'),(6,4,'Kết quả duyệt vé tháng','Đơn đăng ký vé tháng cho xe biển số 99A-88888 đã được CHẤP THUẬN (Thời hạn: 30/6/2026).','MONTHLY_STATUS_UPDATED',1,'2026-05-30 14:48:23'),(7,4,'Kết quả duyệt vé tháng','Đơn đăng ký vé tháng cho xe biển số 29A-99999 đã bị TỪ CHỐI hoặc HỦY.','MONTHLY_STATUS_UPDATED',1,'2026-05-30 14:48:29'),(8,1,'Yêu cầu gia hạn vé tháng','Cư dân Trần Văn An (Căn hộ A101) đã gửi yêu cầu gia hạn vé tháng cho xe biển số 48AB-9999 (Thời hạn mới dự kiến: từ 3/6/2026 đến 3/7/2026).','MONTHLY_RENEW_REQUEST',1,'2026-05-30 14:55:08'),(9,2,'Yêu cầu gia hạn vé tháng','Cư dân Trần Văn An (Căn hộ A101) đã gửi yêu cầu gia hạn vé tháng cho xe biển số 48AB-9999 (Thời hạn mới dự kiến: từ 3/6/2026 đến 3/7/2026).','MONTHLY_RENEW_REQUEST',1,'2026-05-30 14:55:08'),(10,4,'Kết quả duyệt vé tháng','Đơn đăng ký vé tháng cho xe biển số 48AB-9999 đã được CHẤP THUẬN (Thời hạn: 3/7/2026).','MONTHLY_STATUS_UPDATED',1,'2026-05-30 14:55:36'),(11,4,'Kết quả duyệt đăng ký xe','Yêu cầu đăng ký xe biển số 47A99999 của bạn đã được CHẤP THUẬN.','VEHICLE_APPROVED',1,'2026-05-31 15:19:40'),(12,1,'Yêu cầu gia hạn vé tháng','Cư dân Trần Văn An (Căn hộ A101) đã gửi yêu cầu gia hạn vé tháng cho xe biển số 48AB-9999 (Thời hạn mới dự kiến: từ 4/7/2026 đến 4/8/2026).','MONTHLY_RENEW_REQUEST',1,'2026-05-31 15:46:45'),(13,2,'Yêu cầu gia hạn vé tháng','Cư dân Trần Văn An (Căn hộ A101) đã gửi yêu cầu gia hạn vé tháng cho xe biển số 48AB-9999 (Thời hạn mới dự kiến: từ 4/7/2026 đến 4/8/2026).','MONTHLY_RENEW_REQUEST',1,'2026-05-31 15:46:45'),(14,4,'Kết quả duyệt vé tháng','Đơn đăng ký vé tháng cho xe biển số 48AB-9999 đã được CHẤP THUẬN (Thời hạn: 4/8/2026).','MONTHLY_STATUS_UPDATED',1,'2026-05-31 15:50:52'),(15,2,'Yêu cầu duyệt đăng ký xe mới','Cư dân Nguyễn Mai Anh (Căn hộ A405) đã đăng ký xe mới biển số 99A-456789, loại xe Ô tô. Vui lòng phê duyệt.','VEHICLE_APPROVAL_REQUEST',1,'2026-06-01 03:06:38'),(16,9,'Yêu cầu duyệt đăng ký xe mới','Cư dân Nguyễn Mai Anh (Căn hộ A405) đã đăng ký xe mới biển số 99A-456789, loại xe Ô tô. Vui lòng phê duyệt.','VEHICLE_APPROVAL_REQUEST',0,'2026-06-01 03:06:38'),(17,7,'Kết quả duyệt đăng ký xe','Yêu cầu đăng ký xe biển số 99A-456789 của bạn đã được CHẤP THUẬN.','VEHICLE_APPROVED',0,'2026-06-01 03:06:54'),(18,1,'Hoạt động Admin: Duyệt xe','Admin admin vừa phê duyệt xe biển số 99A-456789.','ADMIN_ACTIVITY',1,'2026-06-01 03:06:54'),(19,2,'Yêu cầu duyệt đăng ký xe mới','Cư dân Phạm Quang Dũng (Căn hộ C303) đã đăng ký xe mới biển số 11AB-32564, loại xe Xe máy. Vui lòng phê duyệt.','VEHICLE_APPROVAL_REQUEST',1,'2026-06-01 03:16:39'),(20,9,'Yêu cầu duyệt đăng ký xe mới','Cư dân Phạm Quang Dũng (Căn hộ C303) đã đăng ký xe mới biển số 11AB-32564, loại xe Xe máy. Vui lòng phê duyệt.','VEHICLE_APPROVAL_REQUEST',0,'2026-06-01 03:16:39'),(21,6,'Kết quả duyệt đăng ký xe','Yêu cầu đăng ký xe biển số 11AB-32564 của bạn đã được CHẤP THUẬN.','VEHICLE_APPROVED',0,'2026-06-01 03:16:50');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parking_area`
--

DROP TABLE IF EXISTS `parking_area`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parking_area` (
  `area_id` int NOT NULL AUTO_INCREMENT,
  `area_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type_id` int DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `available_slots` int DEFAULT NULL,
  PRIMARY KEY (`area_id`),
  KEY `type_id` (`type_id`),
  CONSTRAINT `parking_area_ibfk_1` FOREIGN KEY (`type_id`) REFERENCES `vehicle_types` (`type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parking_area`
--

LOCK TABLES `parking_area` WRITE;
/*!40000 ALTER TABLE `parking_area` DISABLE KEYS */;
INSERT INTO `parking_area` VALUES (1,'Tầng hầm B1 - Xe máy',1,100,95),(2,'Tầng hầm B2 - Ô tô',2,50,48);
/*!40000 ALTER TABLE `parking_area` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parking_fee`
--

DROP TABLE IF EXISTS `parking_fee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parking_fee` (
  `type_id` int NOT NULL,
  `monthly_fee` decimal(12,2) DEFAULT NULL,
  `block_hours` int DEFAULT '4',
  `day_block_price` decimal(12,2) DEFAULT NULL,
  `night_block_price` decimal(12,2) DEFAULT NULL,
  PRIMARY KEY (`type_id`),
  CONSTRAINT `parking_fee_ibfk_1` FOREIGN KEY (`type_id`) REFERENCES `vehicle_types` (`type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parking_fee`
--

LOCK TABLES `parking_fee` WRITE;
/*!40000 ALTER TABLE `parking_fee` DISABLE KEYS */;
INSERT INTO `parking_fee` VALUES (1,150000.00,4,4000.00,5000.00),(2,1500000.00,4,35000.00,35000.00);
/*!40000 ALTER TABLE `parking_fee` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parking_session`
--

DROP TABLE IF EXISTS `parking_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parking_session` (
  `session_id` int NOT NULL AUTO_INCREMENT,
  `plate_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `staff_id` int DEFAULT NULL,
  `time_in` timestamp NOT NULL,
  `time_out` timestamp NULL DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'parking',
  `type_id` int DEFAULT NULL,
  `fee_amount` decimal(12,2) DEFAULT '0.00',
  PRIMARY KEY (`session_id`),
  KEY `plate_number` (`plate_number`),
  KEY `staff_id` (`staff_id`),
  KEY `type_id` (`type_id`),
  CONSTRAINT `parking_session_ibfk_2` FOREIGN KEY (`staff_id`) REFERENCES `security` (`staff_id`),
  CONSTRAINT `parking_session_ibfk_3` FOREIGN KEY (`type_id`) REFERENCES `vehicle_types` (`type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parking_session`
--

LOCK TABLES `parking_session` WRITE;
/*!40000 ALTER TABLE `parking_session` DISABLE KEYS */;
INSERT INTO `parking_session` VALUES (2,'30B-67890',1,'2026-05-17 00:10:29',NULL,'parking',2,0.00),(5,'59M1-11111',1,'2026-05-17 02:19:09',NULL,'parking',1,0.00),(6,'47AA-11111',1,'2026-05-21 02:29:10','2026-05-27 02:25:04','completed',1,162000.00),(8,'29A-99999',1,'2026-05-27 01:55:09','2026-05-27 01:56:55','completed',1,0.00),(9,'29A-99999',1,'2026-05-27 01:58:57','2026-05-27 01:59:21','completed',1,0.00),(10,'47AA99999',1,'2026-05-27 02:00:01',NULL,'parking',1,0.00),(11,'47AA11111',1,'2026-05-27 02:26:09','2026-05-27 02:28:03','completed',1,4000.00),(12,'47AA11111',1,'2026-05-27 02:28:03','2026-05-27 02:28:04','completed',2,35000.00),(13,'47AA11111',1,'2026-05-27 02:28:05','2026-05-27 02:28:06','completed',2,35000.00),(14,'47AA1111',1,'2026-05-27 02:28:19','2026-05-27 02:28:19','completed',2,35000.00),(15,'47AA11111',1,'2026-05-27 02:28:40','2026-05-30 14:02:53','completed',1,93000.00),(16,'50A88888',1,'2026-06-01 02:59:43','2026-06-01 02:59:55','completed',1,4000.00);
/*!40000 ALTER TABLE `parking_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `residents`
--

DROP TABLE IF EXISTS `residents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `residents` (
  `resident_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `apartment_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`resident_id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `residents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `residents`
--

LOCK TABLES `residents` WRITE;
/*!40000 ALTER TABLE `residents` DISABLE KEYS */;
INSERT INTO `residents` VALUES (1,4,'Trần Văn An','A101','0912345678','an@email.com'),(2,5,'Lê Thị Bình','B202','0923456789','binh@email.com'),(3,6,'Phạm Quang Dũng','C303','0934567890','dungpq@email.com'),(4,7,'Nguyễn Mai Anh','A405','0945678901','maianh@email.com'),(5,8,'Lê Huy Trường','A108','0855777108','lehuytruongg2005@gmail.com');
/*!40000 ALTER TABLE `residents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `role_id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Super Admin'),(2,'Admin'),(3,'Security'),(4,'Resident');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `security`
--

DROP TABLE IF EXISTS `security`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `security` (
  `staff_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`staff_id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `security_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `security`
--

LOCK TABLES `security` WRITE;
/*!40000 ALTER TABLE `security` DISABLE KEYS */;
INSERT INTO `security` VALUES (1,3,'Nguyễn Bảo Vệ','0901234567');
/*!40000 ALTER TABLE `security` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` int DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'superadmin','$2b$10$B4Sx4pi/0IVLnLp4E/Mt5eNUCA1vczBDWtMu7RYftuQZlDLv/asWa',1,'active','2026-05-17 02:10:29'),(2,'admin','$2b$10$B4Sx4pi/0IVLnLp4E/Mt5eNUCA1vczBDWtMu7RYftuQZlDLv/asWa',2,'active','2026-05-17 02:10:29'),(3,'security','$2b$10$B4Sx4pi/0IVLnLp4E/Mt5eNUCA1vczBDWtMu7RYftuQZlDLv/asWa',3,'active','2026-05-17 02:10:29'),(4,'resident','$2b$10$B4Sx4pi/0IVLnLp4E/Mt5eNUCA1vczBDWtMu7RYftuQZlDLv/asWa',4,'active','2026-05-17 02:10:29'),(5,'resident2','$2b$10$B4Sx4pi/0IVLnLp4E/Mt5eNUCA1vczBDWtMu7RYftuQZlDLv/asWa',4,'active','2026-05-17 02:10:29'),(6,'resident3','$2b$10$B4Sx4pi/0IVLnLp4E/Mt5eNUCA1vczBDWtMu7RYftuQZlDLv/asWa',4,'active','2026-05-17 02:10:29'),(7,'resident4','$2b$10$B4Sx4pi/0IVLnLp4E/Mt5eNUCA1vczBDWtMu7RYftuQZlDLv/asWa',4,'active','2026-05-17 02:10:29'),(8,'lehuytruong','$2b$10$33hZ.3TsCApbyAvufXndMO6fci3I7E74w192ApYYkHDtUbgZSP3Iu',4,'active','2026-05-21 04:02:43'),(9,'admin1','$2b$10$WpPXgHQJ7dBhRmMdEWUd3OOVLHE0rF23A/wEGZRaoKx6uNEHjSLQ6',2,'active','2026-06-01 02:07:02');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle_types`
--

DROP TABLE IF EXISTS `vehicle_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_types` (
  `type_id` int NOT NULL,
  `type_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle_types`
--

LOCK TABLES `vehicle_types` WRITE;
/*!40000 ALTER TABLE `vehicle_types` DISABLE KEYS */;
INSERT INTO `vehicle_types` VALUES (1,'Xe máy'),(2,'Ô tô');
/*!40000 ALTER TABLE `vehicle_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicles`
--

DROP TABLE IF EXISTS `vehicles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicles` (
  `plate_number` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resident_id` int DEFAULT NULL,
  `type_id` int DEFAULT NULL,
  `color` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  PRIMARY KEY (`plate_number`),
  KEY `resident_id` (`resident_id`),
  KEY `type_id` (`type_id`),
  CONSTRAINT `vehicles_ibfk_1` FOREIGN KEY (`resident_id`) REFERENCES `residents` (`resident_id`),
  CONSTRAINT `vehicles_ibfk_2` FOREIGN KEY (`type_id`) REFERENCES `vehicle_types` (`type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicles`
--

LOCK TABLES `vehicles` WRITE;
/*!40000 ALTER TABLE `vehicles` DISABLE KEYS */;
INSERT INTO `vehicles` VALUES ('11AB-32564',3,1,'Xanh','active'),('29A-12345',1,1,'Đỏ','deleted'),('29A-99999',1,1,'','deleted'),('30B-67890',2,2,'Trắng','active'),('47A99999',1,2,'Đen','active'),('47AA-04611',5,1,'Xám','active'),('48AB-9999',1,1,'đen trắg','active'),('51A-99999',1,2,'Đen','deleted'),('51F-99999',3,2,'Đen','active'),('59M1-11111',3,1,'Xanh','active'),('60C-88888',4,1,'Xám','active'),('99A-456789',4,2,'Đỏ','active'),('99A-88888',1,2,'Vàng','active');
/*!40000 ALTER TABLE `vehicles` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-01 10:41:29
