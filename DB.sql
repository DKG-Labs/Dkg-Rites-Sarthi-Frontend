CREATE DATABASE  IF NOT EXISTS `sarthiworkflow` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `sarthiworkflow`;
-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: sarthiworkflow
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cluster_cm_user`
--

DROP TABLE IF EXISTS `cluster_cm_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cluster_cm_user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cluster_name` varchar(100) NOT NULL,
  `cm_user_id` int NOT NULL,
  `created_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cm_user_id` (`cm_user_id`),
  CONSTRAINT `cluster_cm_user_ibfk_1` FOREIGN KEY (`cm_user_id`) REFERENCES `user_master` (`userId`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cluster_cm_user`
--

LOCK TABLES `cluster_cm_user` WRITE;
/*!40000 ALTER TABLE `cluster_cm_user` DISABLE KEYS */;
INSERT INTO `cluster_cm_user` VALUES (1,'BANGALORE_CLUSTER',20,'2025-11-29 01:00:36'),(2,'DELHI_CLUSTER',20,'2025-11-29 06:31:54');
/*!40000 ALTER TABLE `cluster_cm_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cluster_primary_ie`
--

DROP TABLE IF EXISTS `cluster_primary_ie`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cluster_primary_ie` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cluster_name` varchar(50) NOT NULL,
  `ie_user_id` int NOT NULL,
  `created_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ie_user_id` (`ie_user_id`),
  CONSTRAINT `cluster_primary_ie_ibfk_1` FOREIGN KEY (`ie_user_id`) REFERENCES `user_master` (`userId`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cluster_primary_ie`
--

LOCK TABLES `cluster_primary_ie` WRITE;
/*!40000 ALTER TABLE `cluster_primary_ie` DISABLE KEYS */;
INSERT INTO `cluster_primary_ie` VALUES (1,'BANGALORE_CLUSTER',13,'2025-11-28 05:33:45');
/*!40000 ALTER TABLE `cluster_primary_ie` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cluster_rio_user`
--

DROP TABLE IF EXISTS `cluster_rio_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cluster_rio_user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cluster_name` varchar(50) NOT NULL,
  `rio_user_id` int NOT NULL,
  `created_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `rio_user_id` (`rio_user_id`),
  CONSTRAINT `cluster_rio_user_ibfk_1` FOREIGN KEY (`rio_user_id`) REFERENCES `user_master` (`userId`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cluster_rio_user`
--

LOCK TABLES `cluster_rio_user` WRITE;
/*!40000 ALTER TABLE `cluster_rio_user` DISABLE KEYS */;
INSERT INTO `cluster_rio_user` VALUES (1,'BANGALORE_CLUSTER',19,'2025-11-28 08:53:31');
/*!40000 ALTER TABLE `cluster_rio_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cluster_secondary_ie`
--

DROP TABLE IF EXISTS `cluster_secondary_ie`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cluster_secondary_ie` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cluster_name` varchar(50) NOT NULL,
  `ie_user_id` int NOT NULL,
  `priority_order` int DEFAULT '1',
  `created_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ie_user_id` (`ie_user_id`),
  CONSTRAINT `cluster_secondary_ie_ibfk_1` FOREIGN KEY (`ie_user_id`) REFERENCES `user_master` (`userId`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cluster_secondary_ie`
--

LOCK TABLES `cluster_secondary_ie` WRITE;
/*!40000 ALTER TABLE `cluster_secondary_ie` DISABLE KEYS */;
INSERT INTO `cluster_secondary_ie` VALUES (1,'BANGALORE_CLUSTER',17,NULL,'2025-11-28 05:43:42'),(2,'BANGALORE_CLUSTER',18,NULL,'2025-11-28 05:43:49'),(3,'BANGALORE_CLUSTER',26,2,'2025-12-11 02:35:48');
/*!40000 ALTER TABLE `cluster_secondary_ie` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inspection_initiation`
--

DROP TABLE IF EXISTS `inspection_initiation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inspection_initiation` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `inspection_request_id` bigint DEFAULT NULL,
  `call_no` varchar(50) DEFAULT NULL,
  `po_no` varchar(50) DEFAULT NULL,
  `shift_of_inspection` varchar(20) DEFAULT NULL,
  `date_of_inspection` date DEFAULT NULL,
  `offered_qty` decimal(15,3) DEFAULT NULL,
  `cm_approval` tinyint(1) DEFAULT '0',
  `section_a_verified` tinyint(1) DEFAULT '0',
  `section_b_verified` tinyint(1) DEFAULT '0',
  `section_c_verified` tinyint(1) DEFAULT '0',
  `section_d_verified` tinyint(1) DEFAULT '0',
  `multiple_lines_active` tinyint(1) DEFAULT '0',
  `production_lines_json` text,
  `product_type` varchar(50) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'INITIATED',
  `action_type` varchar(20) DEFAULT NULL,
  `action_reason` varchar(50) DEFAULT NULL,
  `action_remarks` text,
  `action_date` datetime DEFAULT NULL,
  `initiated_by` varchar(50) DEFAULT NULL,
  `initiated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_init_inspection_request_id` (`inspection_request_id`),
  KEY `idx_init_call_no` (`call_no`),
  KEY `idx_init_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inspection_initiation`
--

LOCK TABLES `inspection_initiation` WRITE;
/*!40000 ALTER TABLE `inspection_initiation` DISABLE KEYS */;
INSERT INTO `inspection_initiation` VALUES (1,1,'CALL-RM-001','PO-2025-1001','A','2025-12-19',4786.000,0,1,1,1,0,0,'[{\"lineNumber\":1,\"icNumber\":\"\",\"poNumber\":\"\",\"rawMaterialICs\":[],\"productType\":\"\"}]','Raw Material','INITIATED',NULL,NULL,NULL,NULL,NULL,'2025-12-18 12:17:15','2025-12-18 12:17:15','2025-12-20 08:21:44'),(2,5,'CALL-RM-005','PO-2025-1005','B','2025-12-19',2175.000,0,1,1,1,0,0,'[{\"lineNumber\":1,\"icNumber\":\"\",\"poNumber\":\"\",\"rawMaterialICs\":[],\"productType\":\"\"}]','Raw Material','INITIATED',NULL,NULL,NULL,NULL,NULL,'2025-12-19 05:43:39','2025-12-19 05:43:39','2025-12-19 11:11:48'),(3,3,'CALL-RM-003','PO-2025-1003','B','2025-12-19',3654.000,0,1,1,1,0,0,NULL,'Raw Material','INITIATED',NULL,NULL,NULL,NULL,NULL,'2025-12-19 10:55:28','2025-12-19 10:55:28','2025-12-19 10:55:28'),(4,NULL,'CALL-2025-002','PO-2025-1002','A','2025-12-20',400.000,0,1,1,1,1,1,'[{\"lineNumber\":1,\"icNumber\":\"CALL-2025-002\",\"poNumber\":\"PO-2025-1002\",\"rawMaterialICs\":[\"RM-IC-003\"],\"productType\":\"MK-V\"},{\"lineNumber\":2,\"icNumber\":\"CALL-2025-003\",\"poNumber\":\"PO-2025-1003\",\"rawMaterialICs\":[\"RM-IC-004\"],\"productType\":\"MK-III\"}]','ERC Process','INITIATED',NULL,NULL,NULL,NULL,NULL,'2025-12-19 12:39:58','2025-12-19 12:39:58','2025-12-20 12:23:06');
/*!40000 ALTER TABLE `inspection_initiation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inspection_schedule`
--

DROP TABLE IF EXISTS `inspection_schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inspection_schedule` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `call_no` varchar(50) NOT NULL,
  `schedule_date` date NOT NULL,
  `reason` varchar(500) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Scheduled',
  `created_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` varchar(100) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `call_no` (`call_no`),
  KEY `idx_call_no` (`call_no`),
  KEY `idx_schedule_date` (`schedule_date`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inspection_schedule`
--

LOCK TABLES `inspection_schedule` WRITE;
/*!40000 ALTER TABLE `inspection_schedule` DISABLE KEYS */;
INSERT INTO `inspection_schedule` VALUES (1,'CALL-RM-005','2025-12-20','Testing','Scheduled','undefined','2025-12-18 06:13:20',NULL,'2025-12-18 06:13:20'),(2,'CALL-RM-001','2025-12-20','Testing','Scheduled','undefined','2025-12-18 06:18:38',NULL,'2025-12-18 06:18:38'),(3,'CALL-RM-003','2025-12-19','00','Rescheduled','undefined','2025-12-19 05:24:54','undefined','2025-12-19 05:24:59'),(4,'CALL-2025-002','0202-02-02','kkl','Scheduled','undefined','2025-12-19 07:07:34',NULL,'2025-12-19 07:07:34');
/*!40000 ALTER TABLE `inspection_schedule` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pincode_cluster`
--

DROP TABLE IF EXISTS `pincode_cluster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pincode_cluster` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pincode` varchar(10) NOT NULL,
  `cluster_name` varchar(50) NOT NULL,
  `created_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pincode_cluster`
--

LOCK TABLES `pincode_cluster` WRITE;
/*!40000 ALTER TABLE `pincode_cluster` DISABLE KEYS */;
INSERT INTO `pincode_cluster` VALUES (1,'110001','DELHI_CLUSTER','2025-11-28 06:17:22'),(2,'110002','DELHI_CLUSTER','2025-11-28 06:17:22'),(3,'110003','DELHI_CLUSTER','2025-11-28 06:17:22'),(4,'121003','DELHI_CLUSTER','2025-11-28 06:17:22'),(5,'400001','MUMBAI_CLUSTER','2025-11-28 06:17:22'),(6,'400002','MUMBAI_CLUSTER','2025-11-28 06:17:22'),(7,'400703','MUMBAI_CLUSTER','2025-11-28 06:17:22'),(8,'401107','MUMBAI_CLUSTER','2025-11-28 06:17:22'),(9,'600001','CHENNAI_CLUSTER','2025-11-28 06:17:22'),(10,'600002','CHENNAI_CLUSTER','2025-11-28 06:17:22'),(11,'600100','CHENNAI_CLUSTER','2025-11-28 06:17:22'),(12,'700001','KOLKATA_CLUSTER','2025-11-28 06:17:22'),(13,'700020','KOLKATA_CLUSTER','2025-11-28 06:17:22'),(14,'711101','KOLKATA_CLUSTER','2025-11-28 06:17:22'),(15,'560001','BANGALORE_CLUSTER','2025-11-28 06:17:22'),(16,'560048','BANGALORE_CLUSTER','2025-11-28 06:17:22'),(17,'560100','BANGALORE_CLUSTER','2025-11-28 06:17:22');
/*!40000 ALTER TABLE `pincode_cluster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `process_ie_mapping`
--

DROP TABLE IF EXISTS `process_ie_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `process_ie_mapping` (
  `id` int NOT NULL AUTO_INCREMENT,
  `process_ie_user_id` int NOT NULL,
  `ie_user_id` int NOT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `created_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `process_ie_mapping`
--

LOCK TABLES `process_ie_mapping` WRITE;
/*!40000 ALTER TABLE `process_ie_mapping` DISABLE KEYS */;
INSERT INTO `process_ie_mapping` VALUES (1,21,1,'1','2025-12-04 02:10:57'),(2,21,13,'1','2025-12-04 02:10:57'),(3,21,20,'1','2025-12-04 02:10:57'),(4,28,13,NULL,'2025-12-11 03:06:32');
/*!40000 ALTER TABLE `process_ie_mapping` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `process_ie_master`
--

DROP TABLE IF EXISTS `process_ie_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `process_ie_master` (
  `id` int NOT NULL AUTO_INCREMENT,
  `process_ie_user_id` int NOT NULL,
  `cluster_name` varchar(100) NOT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `created_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `process_ie_master`
--

LOCK TABLES `process_ie_master` WRITE;
/*!40000 ALTER TABLE `process_ie_master` DISABLE KEYS */;
INSERT INTO `process_ie_master` VALUES (1,21,'BANGALORE_CLUSTER','1','2025-12-04 02:10:57'),(2,28,'BANGALORE_CLUSTER',NULL,'2025-12-11 03:06:32');
/*!40000 ALTER TABLE `process_ie_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `region_cluster`
--

DROP TABLE IF EXISTS `region_cluster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `region_cluster` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cluster_name` varchar(50) NOT NULL,
  `region_name` varchar(20) NOT NULL,
  `created_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `region_cluster`
--

LOCK TABLES `region_cluster` WRITE;
/*!40000 ALTER TABLE `region_cluster` DISABLE KEYS */;
INSERT INTO `region_cluster` VALUES (1,'DELHI_CLUSTER','NRIO','2025-11-28 06:17:48'),(2,'MUMBAI_CLUSTER','WRIO','2025-11-28 06:17:48'),(3,'CHENNAI_CLUSTER','SRIO','2025-11-28 06:17:48'),(4,'BANGALORE_CLUSTER','SRIO','2025-11-28 06:17:48'),(5,'KOLKATA_CLUSTER','ERIO','2025-11-28 06:17:48');
/*!40000 ALTER TABLE `region_cluster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `region_sbu_head`
--

DROP TABLE IF EXISTS `region_sbu_head`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `region_sbu_head` (
  `id` int NOT NULL AUTO_INCREMENT,
  `region_name` varchar(50) NOT NULL,
  `sbu_head_user_id` int NOT NULL,
  `created_date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `region_sbu_head`
--

LOCK TABLES `region_sbu_head` WRITE;
/*!40000 ALTER TABLE `region_sbu_head` DISABLE KEYS */;
INSERT INTO `region_sbu_head` VALUES (1,'SRIO',29,'2025-12-12 06:23:16');
/*!40000 ALTER TABLE `region_sbu_head` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rm_calibration_documents`
--

DROP TABLE IF EXISTS `rm_calibration_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rm_calibration_documents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `inspection_call_no` varchar(50) NOT NULL,
  `heat_no` varchar(50) NOT NULL,
  `heat_index` int DEFAULT NULL,
  `rdso_approval_id` varchar(50) DEFAULT NULL,
  `rdso_valid_from` date DEFAULT NULL,
  `rdso_valid_to` date DEFAULT NULL,
  `gauges_available` tinyint(1) DEFAULT '0',
  `ladle_carbon_percent` decimal(6,4) DEFAULT NULL,
  `ladle_silicon_percent` decimal(6,4) DEFAULT NULL,
  `ladle_manganese_percent` decimal(6,4) DEFAULT NULL,
  `ladle_phosphorus_percent` decimal(6,4) DEFAULT NULL,
  `ladle_sulphur_percent` decimal(6,4) DEFAULT NULL,
  `vendor_verified` tinyint(1) DEFAULT '0',
  `verified_by` varchar(100) DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rm_cal_call_no` (`inspection_call_no`),
  KEY `idx_rm_cal_heat_no` (`heat_no`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rm_calibration_documents`
--

LOCK TABLES `rm_calibration_documents` WRITE;
/*!40000 ALTER TABLE `rm_calibration_documents` DISABLE KEYS */;
INSERT INTO `rm_calibration_documents` VALUES (1,'CALL-RM-005','HT-2025-011',0,'22','2021-05-02','2025-05-02',0,2.0000,2.0000,1.0000,0.0100,0.0200,0,NULL,NULL,'2025-12-19 09:29:52'),(2,'CALL-RM-001','HT-2025-001',0,'22','2025-12-02','2025-12-05',1,0.5000,1.6000,0.9000,0.0030,0.0290,0,NULL,NULL,'2025-12-19 10:49:57'),(3,'CALL-RM-001','HT-2025-002',1,'22','2025-12-02','2025-12-05',1,1.0000,1.0000,1.0000,1.0000,1.0000,0,NULL,NULL,'2025-12-19 10:49:57'),(4,'CALL-RM-001','HT-2025-003',2,'22','2025-12-02','2025-12-05',1,2.0000,2.0000,2.0000,2.0000,2.0000,0,NULL,NULL,'2025-12-19 10:49:57'),(5,'CALL-RM-003','HT-2025-007',0,'100','2025-05-02','2026-05-20',1,1.0000,0.0000,10.0000,1.0000,10.0000,0,NULL,NULL,'2025-12-19 10:58:33'),(6,'CALL-RM-003','HT-2025-008',1,'100','2025-05-02','2026-05-20',1,1.0000,4.0000,7.0000,5.0000,2.0000,0,NULL,NULL,'2025-12-19 10:58:33');
/*!40000 ALTER TABLE `rm_calibration_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rm_dimensional_check`
--

DROP TABLE IF EXISTS `rm_dimensional_check`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rm_dimensional_check` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `inspection_call_no` varchar(50) NOT NULL,
  `heat_no` varchar(50) NOT NULL,
  `heat_index` int DEFAULT NULL,
  `sample_number` int NOT NULL,
  `diameter` decimal(10,4) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rm_dim_call_no` (`inspection_call_no`),
  KEY `idx_rm_dim_heat_no` (`heat_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rm_dimensional_check`
--

LOCK TABLES `rm_dimensional_check` WRITE;
/*!40000 ALTER TABLE `rm_dimensional_check` DISABLE KEYS */;
/*!40000 ALTER TABLE `rm_dimensional_check` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rm_heat_final_result`
--

DROP TABLE IF EXISTS `rm_heat_final_result`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rm_heat_final_result` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `inspection_call_no` varchar(50) NOT NULL,
  `heat_index` int DEFAULT NULL,
  `heat_no` varchar(50) NOT NULL,
  `tc_no` varchar(50) DEFAULT NULL,
  `tc_date` date DEFAULT NULL,
  `manufacturer_name` varchar(200) DEFAULT NULL,
  `invoice_number` varchar(50) DEFAULT NULL,
  `invoice_date` date DEFAULT NULL,
  `sub_po_number` varchar(50) DEFAULT NULL,
  `sub_po_date` date DEFAULT NULL,
  `sub_po_qty` decimal(12,4) DEFAULT NULL,
  `total_value_of_po` varchar(50) DEFAULT NULL,
  `tc_quantity` decimal(12,4) DEFAULT NULL,
  `offered_qty` decimal(12,4) DEFAULT NULL,
  `color_code` varchar(50) DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `weight_offered_mt` decimal(12,4) DEFAULT NULL,
  `weight_accepted_mt` decimal(12,4) DEFAULT NULL,
  `weight_rejected_mt` decimal(12,4) DEFAULT NULL,
  `calibration_status` varchar(20) DEFAULT NULL,
  `visual_status` varchar(20) DEFAULT NULL,
  `dimensional_status` varchar(20) DEFAULT NULL,
  `material_test_status` varchar(20) DEFAULT NULL,
  `packing_status` varchar(20) DEFAULT NULL,
  `remarks` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rm_heat_call_no` (`inspection_call_no`),
  KEY `idx_rm_heat_heat_no` (`heat_no`),
  KEY `idx_rm_heat_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rm_heat_final_result`
--

LOCK TABLES `rm_heat_final_result` WRITE;
/*!40000 ALTER TABLE `rm_heat_final_result` DISABLE KEYS */;
INSERT INTO `rm_heat_final_result` VALUES (1,'CALL-RM-005',0,'HT-2025-011','TC-45850','2025-11-25','Sunflag Iron and Steel','INV-2025-5001','2025-11-24','SPO-2025-501','2025-11-20',2500.0000,'₹ ?262500.00',2500.0000,2.5000,NULL,'REJECTED',2.5000,0.0000,2.5000,'NOT OK','OK','NOT OK','NOT OK','OK',NULL,'2025-12-19 09:29:52'),(14,'CALL-RM-001',0,'HT-2025-001','TC-45678','2025-11-15','Steel India Ltd','INV-2025-1001','2025-11-14','SPO-2025-101','2025-11-10',5000.0000,'₹ ?504450.00',5000.0000,1.5000,'10','REJECTED',1.5000,0.0000,1.5000,'OK','OK','NOT OK','NOT OK','OK',NULL,'2025-12-19 10:49:57'),(15,'CALL-RM-001',1,'HT-2025-002','TC-45681','2025-11-20','XYZ Materials Co.','INV-2025-1004','2025-11-19','SPO-2025-104','2025-11-18',8000.0000,'₹ ?885120.00',8000.0000,2.2500,'10','REJECTED',2.2500,0.0000,2.2500,'NOT OK','Pending','NOT OK','Pending','OK',NULL,'2025-12-19 10:49:57'),(16,'CALL-RM-001',2,'HT-2025-003','TC-45690','2025-11-18','JSW Steel Ltd','INV-2025-1010','2025-11-20','SPO-2025-106','2025-11-12',7500.0000,'₹ ?778800.00',7500.0000,1.7500,'10','REJECTED',1.7500,0.0000,1.7500,'NOT OK','Pending','NOT OK','Pending','OK',NULL,'2025-12-19 10:49:57'),(17,'CALL-RM-003',0,'HT-2025-007','TC-45750','2025-11-10','Essar Steel Ltd','INV-2025-3001','2025-11-09','SPO-2025-301','2025-11-05',4000.0000,'₹ ?408000.00',4000.0000,2.0000,'1','REJECTED',2.0000,0.0000,2.0000,'NOT OK','NOT OK','NOT OK','NOT OK','OK',NULL,'2025-12-19 10:58:33'),(18,'CALL-RM-003',1,'HT-2025-008','TC-45751','2025-11-12','Essar Steel Ltd','INV-2025-3002','2025-11-11','SPO-2025-302','2025-11-06',3800.0000,'₹ ?387600.00',3800.0000,2.2000,'0','REJECTED',2.2000,0.0000,2.2000,'NOT OK','NOT OK','NOT OK','NOT OK','OK',NULL,'2025-12-19 10:58:33');
/*!40000 ALTER TABLE `rm_heat_final_result` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rm_heat_tc_mapping`
--

DROP TABLE IF EXISTS `rm_heat_tc_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rm_heat_tc_mapping` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `inspection_request_id` bigint NOT NULL,
  `heat_number` varchar(50) NOT NULL,
  `tc_number` varchar(50) DEFAULT NULL,
  `tc_date` date DEFAULT NULL,
  `manufacturer` varchar(200) DEFAULT NULL,
  `invoice_no` varchar(50) DEFAULT NULL,
  `invoice_date` date DEFAULT NULL,
  `sub_po_number` varchar(50) DEFAULT NULL,
  `sub_po_date` date DEFAULT NULL,
  `sub_po_qty` varchar(50) DEFAULT NULL,
  `sub_po_total_value` varchar(50) DEFAULT NULL,
  `tc_qty` varchar(50) DEFAULT NULL,
  `tc_qty_remaining` varchar(50) DEFAULT NULL,
  `offered_qty` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inspection_request_id` (`inspection_request_id`),
  KEY `idx_heat_number` (`heat_number`),
  KEY `idx_tc_number` (`tc_number`),
  CONSTRAINT `fk_heat_tc_inspection_request` FOREIGN KEY (`inspection_request_id`) REFERENCES `vendor_inspection_request` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rm_heat_tc_mapping`
--

LOCK TABLES `rm_heat_tc_mapping` WRITE;
/*!40000 ALTER TABLE `rm_heat_tc_mapping` DISABLE KEYS */;
INSERT INTO `rm_heat_tc_mapping` VALUES (1,1,'HT-2025-001','TC-45678','2025-11-15','Steel India Ltd','INV-2025-1001','2025-11-14','SPO-2025-101','2025-11-10','5000 Kg','?504450.00','5000 Kg','2000 Kg','1.500','2025-12-18 16:38:46','2025-12-18 16:38:46'),(2,1,'HT-2025-002','TC-45681','2025-11-20','XYZ Materials Co.','INV-2025-1004','2025-11-19','SPO-2025-104','2025-11-18','8000 Kg','?885120.00','8000 Kg','4000 Kg','2.250','2025-12-18 16:38:46','2025-12-18 16:38:46'),(3,1,'HT-2025-003','TC-45690','2025-11-18','JSW Steel Ltd','INV-2025-1010','2025-11-20','SPO-2025-106','2025-11-12','7500 Kg','?778800.00','7500 Kg','7500 Kg','1.750','2025-12-18 16:38:46','2025-12-18 16:38:46'),(4,2,'HT-2025-004','TC-45701','2025-11-12','Tata Steel Ltd','INV-2025-2001','2025-11-11','SPO-2025-201','2025-11-08','6000 Kg','?612000.00','6000 Kg','3500 Kg','2.100','2025-12-18 16:39:56','2025-12-18 16:39:56'),(5,2,'HT-2025-005','TC-45702','2025-11-14','SAIL Bhilai','INV-2025-2002','2025-11-13','SPO-2025-202','2025-11-09','4500 Kg','?459000.00','4500 Kg','2000 Kg','2.500','2025-12-18 16:39:56','2025-12-18 16:39:56'),(6,2,'HT-2025-006','TC-45703','2025-11-16','Jindal Steel Works','INV-2025-2003','2025-11-15','SPO-2025-203','2025-11-10','5500 Kg','?561000.00','5500 Kg','3000 Kg','2.650','2025-12-18 16:39:56','2025-12-18 16:39:56'),(7,3,'HT-2025-007','TC-45750','2025-11-10','Essar Steel Ltd','INV-2025-3001','2025-11-09','SPO-2025-301','2025-11-05','4000 Kg','?408000.00','4000 Kg','2500 Kg','2.000','2025-12-18 16:40:16','2025-12-18 16:40:16'),(8,3,'HT-2025-008','TC-45751','2025-11-12','Essar Steel Ltd','INV-2025-3002','2025-11-11','SPO-2025-302','2025-11-06','3800 Kg','?387600.00','3800 Kg','1800 Kg','2.200','2025-12-18 16:40:16','2025-12-18 16:40:16'),(9,4,'HT-2025-009','TC-45800','2025-11-20','RINL Vizag Steel','INV-2025-4001','2025-11-19','SPO-2025-401','2025-11-15','5500 Kg','?572000.00','5500 Kg','3200 Kg','2.800','2025-12-18 16:40:36','2025-12-18 16:40:36'),(10,4,'HT-2025-010','TC-45801','2025-11-22','RINL Vizag Steel','INV-2025-4002','2025-11-21','SPO-2025-402','2025-11-16','4800 Kg','?499200.00','4800 Kg','2800 Kg','3.000','2025-12-18 16:40:36','2025-12-18 16:40:36'),(11,5,'HT-2025-011','TC-45850','2025-11-25','Sunflag Iron and Steel','INV-2025-5001','2025-11-24','SPO-2025-501','2025-11-20','2500 Kg','?262500.00','2500 Kg','2500 Kg','2.500','2025-12-18 16:40:55','2025-12-18 16:40:55');
/*!40000 ALTER TABLE `rm_heat_tc_mapping` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rm_inspection_summary`
--

DROP TABLE IF EXISTS `rm_inspection_summary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rm_inspection_summary` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `inspection_call_no` varchar(50) NOT NULL,
  `total_heats_offered` int DEFAULT NULL,
  `total_qty_offered_mt` decimal(12,4) DEFAULT NULL,
  `number_of_bundles` int DEFAULT NULL,
  `number_of_erc` int DEFAULT NULL,
  `product_model` varchar(20) DEFAULT NULL,
  `po_no` varchar(50) DEFAULT NULL,
  `po_date` date DEFAULT NULL,
  `vendor_name` varchar(200) DEFAULT NULL,
  `place_of_inspection` varchar(200) DEFAULT NULL,
  `source_of_raw_material` varchar(100) DEFAULT NULL,
  `finished_by` varchar(100) DEFAULT NULL,
  `finished_at` datetime DEFAULT NULL,
  `inspection_date` date DEFAULT NULL,
  `shift_of_inspection` varchar(20) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `inspection_call_no` (`inspection_call_no`),
  KEY `idx_rm_sum_call_no` (`inspection_call_no`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rm_inspection_summary`
--

LOCK TABLES `rm_inspection_summary` WRITE;
/*!40000 ALTER TABLE `rm_inspection_summary` DISABLE KEYS */;
INSERT INTO `rm_inspection_summary` VALUES (1,'CALL-RM-005',1,2.5000,5,27173,'MK-III','PO-2025-1005','2025-11-15','Southern Alloys Ltd','Plot 25, Cochin Special Economic Zone, Kakkanad, Kochi - 682037',NULL,'admin','2025-12-19 03:59:51','2025-12-19','A','2025-12-19 09:29:52','2025-12-19 09:29:52'),(6,'CALL-RM-001',3,5.5000,2,59782,'MK-III','PO-2025-1001','2025-11-01','ABC Industries Pvt Ltd','Plot 1, MIDC Industrial Area, Andheri East, Mumbai - 400093',NULL,'IE_USER','2025-12-19 05:19:56','2025-12-19','A','2025-12-19 10:49:56','2025-12-19 10:49:56'),(7,'CALL-RM-003',2,4.2000,10,45652,'MK-III','PO-2025-1003','2025-11-08','Prime Steel Industries','Plot 78, SIDCO Industrial Estate, Ambattur, Chennai - 600098',NULL,'IE_USER','2025-12-19 05:28:33','2025-12-19','B','2025-12-19 10:58:33','2025-12-19 10:58:33');
/*!40000 ALTER TABLE `rm_inspection_summary` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rm_material_testing`
--

DROP TABLE IF EXISTS `rm_material_testing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rm_material_testing` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `inspection_call_no` varchar(50) NOT NULL,
  `heat_no` varchar(50) NOT NULL,
  `heat_index` int DEFAULT NULL,
  `sample_number` int NOT NULL,
  `carbon_percent` decimal(6,4) DEFAULT NULL,
  `silicon_percent` decimal(6,4) DEFAULT NULL,
  `manganese_percent` decimal(6,4) DEFAULT NULL,
  `phosphorus_percent` decimal(6,4) DEFAULT NULL,
  `sulphur_percent` decimal(6,4) DEFAULT NULL,
  `grain_size` decimal(8,2) DEFAULT NULL,
  `hardness` decimal(8,2) DEFAULT NULL,
  `decarb` decimal(8,4) DEFAULT NULL,
  `inclusion_a` decimal(8,2) DEFAULT NULL,
  `inclusion_b` decimal(8,2) DEFAULT NULL,
  `inclusion_c` decimal(8,2) DEFAULT NULL,
  `inclusion_d` decimal(8,2) DEFAULT NULL,
  `remarks` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rm_mat_call_no` (`inspection_call_no`),
  KEY `idx_rm_mat_heat_no` (`heat_no`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rm_material_testing`
--

LOCK TABLES `rm_material_testing` WRITE;
/*!40000 ALTER TABLE `rm_material_testing` DISABLE KEYS */;
INSERT INTO `rm_material_testing` VALUES (1,'CALL-RM-005','HT-2025-011',0,1,4.0000,4.0000,4.0000,44.0000,4.0000,4.00,NULL,NULL,5.00,5.00,5.00,5.00,NULL,'2025-12-19 09:29:52'),(2,'CALL-RM-005','HT-2025-011',0,2,4.0000,4.0000,0.0000,0.0000,2.0000,2.00,NULL,NULL,5.00,5.00,5.00,5.00,NULL,'2025-12-19 09:29:52'),(7,'CALL-RM-001','HT-2025-001',0,1,0.0000,2.0000,2.0000,2.0000,2.0000,2.00,0.00,0.0000,2.00,2.00,2.00,3.00,NULL,'2025-12-19 10:49:57'),(8,'CALL-RM-001','HT-2025-001',0,2,0.0000,2.0000,2.0000,0.0000,2.0000,0.00,2.00,0.0000,3.00,3.00,3.00,3.00,NULL,'2025-12-19 10:49:57'),(9,'CALL-RM-001','HT-2025-002',1,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-19 10:49:57'),(10,'CALL-RM-001','HT-2025-002',1,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-19 10:49:57'),(11,'CALL-RM-001','HT-2025-003',2,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-19 10:49:57'),(12,'CALL-RM-001','HT-2025-003',2,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-19 10:49:57'),(13,'CALL-RM-003','HT-2025-007',0,1,1.0000,1.0000,1.0000,1.0000,1.0000,1.00,1.00,1.0000,1.00,1.00,1.00,2.00,NULL,'2025-12-19 10:58:33'),(14,'CALL-RM-003','HT-2025-007',0,2,1.0000,1.0000,1.0000,1.0000,1.0000,1.00,1.00,1.0000,1.00,1.00,1.00,2.00,NULL,'2025-12-19 10:58:33'),(15,'CALL-RM-003','HT-2025-008',1,1,1.0000,1.0000,1.0000,1.0000,1.0000,1.00,1.00,1.0000,1.00,1.00,2.00,2.00,NULL,'2025-12-19 10:58:33'),(16,'CALL-RM-003','HT-2025-008',1,2,1.0000,1.0000,1.0000,1.0000,1.0000,3.00,3.00,3.0000,2.00,2.00,2.00,2.00,NULL,'2025-12-19 10:58:33');
/*!40000 ALTER TABLE `rm_material_testing` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rm_packing_storage`
--

DROP TABLE IF EXISTS `rm_packing_storage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rm_packing_storage` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `inspection_call_no` varchar(50) NOT NULL,
  `bundling_secure` varchar(10) DEFAULT NULL,
  `tags_attached` varchar(10) DEFAULT NULL,
  `labels_correct` varchar(10) DEFAULT NULL,
  `protection_adequate` varchar(10) DEFAULT NULL,
  `storage_condition` varchar(10) DEFAULT NULL,
  `moisture_protection` varchar(10) DEFAULT NULL,
  `stacking_proper` varchar(10) DEFAULT NULL,
  `remarks` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `inspection_call_no` (`inspection_call_no`),
  KEY `idx_rm_pack_call_no` (`inspection_call_no`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rm_packing_storage`
--

LOCK TABLES `rm_packing_storage` WRITE;
/*!40000 ALTER TABLE `rm_packing_storage` DISABLE KEYS */;
INSERT INTO `rm_packing_storage` VALUES (1,'CALL-RM-005','Yes','Yes','Yes','Yes','Yes','No','No',';\'\'','2025-12-19 09:29:52'),(2,'CALL-RM-001','Yes','Yes','Yes','Yes','Yes','Yes','Yes',NULL,'2025-12-19 10:49:57'),(3,'CALL-RM-003','Yes','Yes','Yes','No','NA','NA','NA',NULL,'2025-12-19 10:58:33');
/*!40000 ALTER TABLE `rm_packing_storage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rm_visual_inspection`
--

DROP TABLE IF EXISTS `rm_visual_inspection`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rm_visual_inspection` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `inspection_call_no` varchar(50) NOT NULL,
  `heat_no` varchar(50) NOT NULL,
  `heat_index` int DEFAULT NULL,
  `defect_name` varchar(100) NOT NULL,
  `is_selected` tinyint(1) DEFAULT '0',
  `defect_length_mm` decimal(10,2) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rm_visual_call_no` (`inspection_call_no`),
  KEY `idx_rm_visual_heat_no` (`heat_no`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rm_visual_inspection`
--

LOCK TABLES `rm_visual_inspection` WRITE;
/*!40000 ALTER TABLE `rm_visual_inspection` DISABLE KEYS */;
INSERT INTO `rm_visual_inspection` VALUES (1,'CALL-RM-005','HT-2025-011',0,'No Defect',1,NULL,'2025-12-19 09:29:52'),(14,'CALL-RM-001','HT-2025-001',0,'No Defect',1,NULL,'2025-12-19 10:49:57'),(15,'CALL-RM-003','HT-2025-007',0,'Kink',1,NULL,'2025-12-19 10:58:33'),(16,'CALL-RM-003','HT-2025-008',1,'Fold',1,NULL,'2025-12-19 10:58:33');
/*!40000 ALTER TABLE `rm_visual_inspection` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_master`
--

DROP TABLE IF EXISTS `role_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_master` (
  `ROLEID` int NOT NULL AUTO_INCREMENT,
  `ROLENAME` varchar(100) NOT NULL,
  `CREATEDBY` varchar(50) DEFAULT NULL,
  `CREATEDDATE` datetime DEFAULT NULL,
  PRIMARY KEY (`ROLEID`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_master`
--

LOCK TABLES `role_master` WRITE;
/*!40000 ALTER TABLE `role_master` DISABLE KEYS */;
INSERT INTO `role_master` VALUES (1,'Vendor','Admin','2025-11-27 11:01:08'),(2,'RIO Help Desk','Admin','2025-11-27 11:01:08'),(3,'IE','Admin','2025-11-27 11:01:08'),(4,'IE Secondary','Admin','2025-11-28 16:16:19'),(5,'Control Manager','Admin','2025-11-29 12:00:10'),(6,'Rio Finance','Admin','2025-12-03 12:08:52'),(7,'Process IE','Admin','2025-12-04 13:09:17'),(8,'SBU Head','Admin','2025-12-12 11:38:00');
/*!40000 ALTER TABLE `role_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transition_condition_master`
--

DROP TABLE IF EXISTS `transition_condition_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transition_condition_master` (
  `conditionId` int NOT NULL AUTO_INCREMENT,
  `workflowId` int NOT NULL,
  `conditionKey` varchar(255) NOT NULL,
  `conditionValue` varchar(255) NOT NULL,
  `createdDate` datetime DEFAULT NULL,
  `createdBy` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`conditionId`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transition_condition_master`
--

LOCK TABLES `transition_condition_master` WRITE;
/*!40000 ALTER TABLE `transition_condition_master` DISABLE KEYS */;
INSERT INTO `transition_condition_master` VALUES (1,2,'PO_STATUS','NOT_OK','2025-11-29 10:12:24','Admin'),(2,2,'PO_STATUS','OK','2025-11-29 10:12:24','Admin'),(3,2,'CM_DECISION','APPROVED','2025-11-29 10:12:24','Admin'),(4,2,'CM_DECISION','REJECTED','2025-11-29 10:12:24','Admin'),(5,2,'PAYMENT_TYPE','NON_PAYABLE','2025-11-29 10:12:24','Admin'),(6,2,'PAYMENT_TYPE','PAYABLE','2025-11-29 10:12:24','Admin'),(7,2,'MATERIAL_AVAILABLE','NO','2025-11-29 10:12:24','Admin'),(8,2,'MATERIAL_AVAILABLE','YES','2025-11-29 10:12:24','Admin'),(9,2,'RESULT_STATUS','NOT_OK','2025-11-29 10:12:24','Admin'),(10,2,'RESULT_STATUS','PARTIAL','2025-11-29 10:12:24','Admin'),(11,2,'RESULT_STATUS','OK','2025-11-29 10:12:24','Admin'),(12,2,'CM_FINAL_APPROVAL','APPROVED','2025-11-29 10:12:24','Admin'),(13,2,'RESULT_STATUS','PARTIAL_NOT_OK','2025-12-03 14:59:13','Admin'),(14,2,'CM_DECISION','APPROVE','2025-12-12 11:13:23','Admin'),(15,2,'CM_DECISION','REJECT','2025-12-12 11:13:23','Admin'),(16,2,'CM_DECISION','FORWARD','2025-12-12 11:13:23','Admin'),(17,2,'SBU_HEAD_DECISION','APPROVE','2025-12-12 11:13:23','Admin'),(18,2,'SBU_HEAD_DECISION','REJECT','2025-12-12 11:13:23','Admin');
/*!40000 ALTER TABLE `transition_condition_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transition_master`
--

DROP TABLE IF EXISTS `transition_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transition_master` (
  `TRANSITIONID` int NOT NULL AUTO_INCREMENT,
  `TRANSITIONNAME` varchar(100) NOT NULL,
  `WORKFLOWID` int NOT NULL,
  `CURRENTROLEID` int NOT NULL,
  `NEXTROLEID` int DEFAULT NULL,
  `TRANSITIONORDER` int DEFAULT NULL,
  `CREATEDBY` varchar(50) DEFAULT NULL,
  `CREATEDDATE` datetime DEFAULT NULL,
  `condition_id` int DEFAULT NULL,
  `CURRENT_ACTION` varchar(100) DEFAULT NULL,
  `NEXT_ACTION` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`TRANSITIONID`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transition_master`
--

LOCK TABLES `transition_master` WRITE;
/*!40000 ALTER TABLE `transition_master` DISABLE KEYS */;
INSERT INTO `transition_master` VALUES (1,'CREATE_CALL',1,1,2,1,'Admin','2025-11-27 11:05:10',NULL,NULL,NULL),(2,'RETURN_TO_VENDOR',1,2,1,2,'Admin','2025-11-27 11:05:36',NULL,NULL,NULL),(3,'FIX_ROUTING',1,2,2,3,'Admin','2025-11-27 11:05:58',NULL,NULL,NULL),(4,'VERIFY_CALL',1,2,3,4,'Admin','2025-11-27 11:06:19',NULL,NULL,NULL),(5,'CM_RETURN_TO_IE',1,4,3,5,'Admin',NULL,NULL,NULL,NULL),(6,'IE_SCHEDULE_CALL',2,3,3,1,'Admin','2025-11-29 10:15:55',NULL,'IE_SCHEDULE_CALL','INITIATE_INSPECTION'),(7,'INITIATE_INSPECTION',2,3,3,2,'Admin','2025-11-29 10:15:55',NULL,'INITIATE_INSPECTION','VERIFY_PO_DETAILS'),(8,'VERIFY_PO_DETAILS',2,3,3,3,'Admin','2025-11-29 10:15:55',1,'VERIFY_PO_DETAILS','ENTER_SHIFT_DETAILS_AND_START_INSPECTION'),(9,'REQUEST_CORRECTION_TO_CM',2,3,5,4,'Admin','2025-11-29 10:15:55',1,'REQUEST_CORRECTION_TO_CM','CM_DECISION'),(10,'ENTER_SHIFT_DETAILS_AND_START_INSPECTION',2,3,3,9,'Admin','2025-11-29 10:15:55',2,'ENTER_SHIFT_DETAILS_AND_START_INSPECTION','VERIFY_MATERIAL_AVAILABILITY'),(11,'CM_APPROVE_CORRECTION',2,5,3,5,'Admin','2025-11-29 10:15:55',3,'CM_APPROVE_CORRECTION','VERIFY_PO_DETAILS'),(12,'CM_REJECT_CORRECTION',2,5,3,6,'Admin','2025-11-29 10:15:55',4,'CM_REJECT_CORRECTION_AND_CHECK_PAYMENT','CANCEL_CALL'),(15,'VERIFY_MATERIAL_AVAILABILITY',2,3,3,10,'Admin','2025-11-29 10:15:55',NULL,'VERIFY_MATERIAL_AVAILABILITY','ENTRY_INSPECTION_RESULTS'),(18,'ENTRY_INSPECTION_RESULTS',2,3,3,13,'Admin','2025-11-29 10:15:55',NULL,'ENTRY_INSPECTION_RESULTS',NULL),(19,'CALL_REJECTED_RAW_OR_FINAL',2,3,3,14,'Admin','2025-11-29 10:15:55',9,NULL,NULL),(20,'PAUSE_INSPECTION_RESUME_NEXT_DAY',2,3,3,15,'Admin','2025-11-29 10:15:55',10,'PAUSE_INSPECTION_RESUME_NEXT_DAY',NULL),(21,'INSPECTION_COMPLETE_CONFIRM',2,3,3,16,'Admin','2025-11-29 10:15:55',11,'INSPECTION_COMPLETE_CONFIRM',NULL),(22,'SUBMIT_INSPECTION_RESULTS_TO_CM',2,2,4,17,'Admin','2025-11-29 10:15:55',NULL,NULL,NULL),(23,'INSPECTION_RESULTS_ACCEPTED_BY_CM',2,4,2,18,'Admin','2025-11-29 10:15:55',12,NULL,NULL),(24,'GENERATE_IC',2,2,2,19,'Admin','2025-11-29 10:15:55',NULL,NULL,NULL),(25,'DSC_SIGN_IC',2,2,2,20,'Admin','2025-11-29 10:15:55',NULL,NULL,NULL),(27,'CANCEL_CALL',2,3,NULL,7,'Admin','2025-12-03 10:40:37',NULL,'CANCEL_CALL','END'),(33,'CALL_REGISTERED',1,6,3,7,'Admin',NULL,NULL,NULL,NULL),(34,'ENTRY_RESULTS_PARTIAL_NOK',2,3,3,14,'Admin','2025-12-03 14:58:56',13,'ENTRY_RESULTS_PARTIAL_NOK',NULL),(35,'CONFIRM_CANCEL_AFTER_PAYMENT',2,3,NULL,NULL,'Admin','2025-12-04 16:02:01',NULL,'PAYMENT_CONFIRMED_CANCEL','END'),(36,'ENTRY_RESULTS_PARTIAL_NOK',2,3,3,14,'Admin','2025-12-04 16:02:01',13,'ENTRY_INSPECTION_RESULTS',NULL),(37,'PAYMENT_VERIFICATION',1,2,6,5,'Admin',NULL,NULL,'PAYMENT_VERIFICATION',NULL),(38,'PARKED_PAYMENT_NOT_RECEIVED',1,6,6,6,'Admin',NULL,NULL,NULL,NULL),(42,'REQUEST_QTY_EDIT',1,1,5,8,'Admin','2025-12-06 12:35:19',NULL,'REQUEST_QTY_EDIT','CM_QTY_DECISION'),(44,'CM_QTY_DECISION',1,5,1,9,'Admin','2025-12-06 12:37:25',3,'CM_QTY_DECISION','QTY_APPROVED'),(45,'CM_QTY_DECISION',1,5,1,10,'Admin','2025-12-06 12:38:00',4,'CM_QTY_DECISION','QTY_REJECTED'),(46,'IE_REQUEST_RESCHEDULE',2,3,5,21,'Admin','2025-12-12 11:14:40',NULL,'IE_REQUEST_RESCHEDULE','CM_RESCHEDULE_DECISION'),(47,'CM_APPROVE_RESCHEDULE',2,5,3,22,'Admin','2025-12-12 11:15:21',14,'CM_APPROVE_RESCHEDULE','IE_RESCHEDULE_UPDATED'),(48,'CM_REJECT_RESCHEDULE',2,5,3,23,'Admin','2025-12-12 11:15:50',15,'CM_REJECT_RESCHEDULE','IE_RESCHEDULE_REJECTED'),(49,'CM_FORWARD_TO_SBU_HEAD',2,5,8,24,'Admin','2025-12-12 11:19:32',16,'CM_FORWARD_RESCHEDULE','SBU_HEAD_RESCHEDULE_DECISION'),(50,'SBU_HEAD_APPROVE_RESCHEDULE',2,8,3,25,'Admin','2025-12-12 11:20:35',17,'SBU_HEAD_APPROVE_RESCHEDULE','IE_RESCHEDULE_UPDATED'),(51,'SBU_HEAD_REJECT_RESCHEDULE',2,8,3,26,'Admin','2025-12-12 11:21:25',18,'SBU_HEAD_REJECT_RESCHEDULE','IE_RESCHEDULE_REJECTED');
/*!40000 ALTER TABLE `transition_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_master`
--

DROP TABLE IF EXISTS `user_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_master` (
  `userId` int NOT NULL AUTO_INCREMENT,
  `password` varchar(100) NOT NULL,
  `userName` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `mobileNumber` varchar(10) DEFAULT NULL,
  `createdDate` datetime DEFAULT NULL,
  `createdBy` varchar(45) DEFAULT NULL,
  `role_name` varchar(255) DEFAULT NULL,
  `employee_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`userId`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_master`
--

LOCK TABLES `user_master` WRITE;
/*!40000 ALTER TABLE `user_master` DISABLE KEYS */;
INSERT INTO `user_master` VALUES (1,'password','uday','Kuday@gmail.com','12345678','2025-11-27 06:16:47','Admin','Vendor','123'),(2,'password','uday','Kuday@gmail.com','12345678','2025-11-27 06:17:49','Admin','Vendor','123'),(3,'password','kishore','Kuday@gmail.com','12345678','2025-11-27 06:19:04','Admin','RIO Help Desk','123'),(4,'password','kiran','Kuday@gmail.com','12345678','2025-11-28 04:39:26','Admin','RIO Help Desk','123'),(5,'password','kiran','Kuday@gmail.com','12345678','2025-11-28 06:21:05','Admin','RIO Help Desk','123'),(6,'password','kishe','Kuday@gmail.com','12345678','2025-11-28 06:50:07','Admin','RIO Help Desk','123'),(7,'password','kishe','Kuday@gmail.com','12345678','2025-11-28 06:53:12','Admin','RIO Help Desk','123'),(8,'password','uday','Kuday@gmail.com','12345678','2025-11-28 06:59:04','Admin','RIO Help Desk','123'),(9,'password','kishore','Kuday@gmail.com','12345678','2025-11-28 06:59:37','Admin','RIO Help Desk','123'),(10,'password','kishore','Kuday@gmail.com','12345678','2025-11-28 10:47:50','Admin','IE','123'),(11,'password','kishore','Kuday@gmail.com','12345678','2025-11-28 10:49:35','Admin','IE','123'),(12,'password','kishore','Kuday@gmail.com','12345678','2025-11-28 10:50:00','Admin','IE','123'),(13,'password','kishore','Kuday@gmail.com','12345678','2025-11-28 11:03:45','Admin','IE','123'),(14,'password','kishore','Kuday@gmail.com','12345678','2025-11-28 11:04:03','Admin','IE','123'),(15,'password','kishore','Kuday@gmail.com','12345678','2025-11-28 11:11:34','Admin','IE','123'),(16,'password','kishore','Kuday@gmail.com','12345678','2025-11-28 11:12:40','Admin','IE','123'),(17,'password','kishore','Kuday@gmail.com','12345678','2025-11-28 11:13:42','Admin','IE Secondary','123'),(18,'password','kishore','Kuday@gmail.com','12345678','2025-11-28 11:13:49','Admin','IE Secondary','123'),(19,'password','kishore','Kuday@gmail.com','12345678','2025-11-28 14:23:31','Admin','RIO Help Desk','123'),(20,'password','kishore','Kuday@gmail.com','12345678','2025-11-29 06:30:35','Admin','Control Manager','123'),(21,'password','string','string@gmail.com','12345678','2025-12-04 07:40:57','1','Process IE','1001'),(22,'string','kk','string','string','2025-12-11 06:52:48','2','Vendor','string'),(23,'kiran','uday','kudaykiran@gmail.com','1234567891','2025-12-11 06:56:34',NULL,'Vendor','12'),(24,'password','uday','password@gmail.com','1234567890','2025-12-11 07:59:30',NULL,'RIO Help Desk','23'),(25,'password','uday','kudaykiran.9949@gmail.com','5678967892','2025-12-11 08:02:07',NULL,'IE','1368'),(26,'password','uday','kudaykiran.9949@gmail.com','5678967892','2025-12-11 08:05:48',NULL,'IE Secondary','1368'),(27,'password','uday','kudaykiran.9949@gmail.com','5678967892','2025-12-11 08:06:39',NULL,'Control Manager','1368'),(28,'password','jk','kudaykiran.9949@gmail.com','0768084629','2025-12-11 08:36:32',NULL,'Process IE','34'),(29,'password','uday','string@gmail.com','1234567','2025-12-12 06:23:16','2','SBU Head','1234');
/*!40000 ALTER TABLE `user_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_role_master`
--

DROP TABLE IF EXISTS `user_role_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_role_master` (
  `userRoleId` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `roleId` int NOT NULL,
  `readPermission` tinyint(1) NOT NULL,
  `writePermission` tinyint(1) NOT NULL,
  `createdDate` datetime DEFAULT NULL,
  `createdBy` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`userRoleId`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_role_master`
--

LOCK TABLES `user_role_master` WRITE;
/*!40000 ALTER TABLE `user_role_master` DISABLE KEYS */;
INSERT INTO `user_role_master` VALUES (1,2,1,1,1,'2025-11-27 06:17:49','Admin'),(2,3,2,1,1,'2025-11-27 06:19:04','Admin'),(3,4,2,1,1,'2025-11-28 04:39:27','Admin'),(4,5,2,1,1,'2025-11-28 06:21:05','Admin'),(5,6,2,1,1,'2025-11-28 06:50:07','Admin'),(6,7,2,1,1,'2025-11-28 06:53:13','Admin'),(7,8,2,1,1,'2025-11-28 06:59:04','Admin'),(8,9,2,1,1,'2025-11-28 06:59:37','Admin'),(9,10,3,1,1,'2025-11-28 10:47:50','Admin'),(10,11,3,1,1,'2025-11-28 10:49:35','Admin'),(11,12,3,1,1,'2025-11-28 10:50:00','Admin'),(12,13,3,1,1,'2025-11-28 11:03:45','Admin'),(13,14,3,1,1,'2025-11-28 11:04:03','Admin'),(14,15,3,1,1,'2025-11-28 11:11:35','Admin'),(15,16,3,1,1,'2025-11-28 11:12:40','Admin'),(16,17,4,1,1,'2025-11-28 11:13:42','Admin'),(17,18,4,1,1,'2025-11-28 11:13:49','Admin'),(18,19,2,1,1,'2025-11-28 14:23:31','Admin'),(19,20,5,1,1,'2025-11-29 06:30:36','Admin'),(20,21,7,1,1,'2025-12-04 07:40:57','1'),(21,22,1,1,1,'2025-12-11 06:52:50','2'),(22,23,1,1,1,'2025-12-11 06:56:34',NULL),(23,24,2,1,1,'2025-12-11 07:59:31',NULL),(24,25,3,1,1,'2025-12-11 08:02:07',NULL),(25,26,4,1,1,'2025-12-11 08:05:48',NULL),(26,27,5,1,1,'2025-12-11 08:06:39',NULL),(27,28,7,1,1,'2025-12-11 08:36:32',NULL),(28,29,8,1,1,'2025-12-12 06:23:16','2');
/*!40000 ALTER TABLE `user_role_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendor_inspection_request`
--

DROP TABLE IF EXISTS `vendor_inspection_request`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_inspection_request` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `po_no` varchar(50) NOT NULL,
  `po_serial_no` varchar(50) DEFAULT NULL,
  `po_date` date DEFAULT NULL,
  `po_description` varchar(255) DEFAULT NULL,
  `po_qty` int DEFAULT NULL,
  `po_unit` varchar(20) DEFAULT NULL,
  `amendment_no` varchar(50) DEFAULT NULL,
  `amendment_date` date DEFAULT NULL,
  `vendor_contact_name` varchar(100) DEFAULT NULL,
  `vendor_contact_phone` varchar(20) DEFAULT NULL,
  `type_of_call` varchar(50) DEFAULT NULL,
  `desired_inspection_date` date DEFAULT NULL,
  `qty_already_inspected_rm` int DEFAULT '0',
  `qty_already_inspected_process` int DEFAULT '0',
  `qty_already_inspected_final` int DEFAULT '0',
  `rm_heat_numbers` varchar(500) DEFAULT NULL,
  `rm_chemical_carbon` decimal(6,4) DEFAULT NULL,
  `rm_chemical_manganese` decimal(6,4) DEFAULT NULL,
  `rm_chemical_silicon` decimal(6,4) DEFAULT NULL,
  `rm_chemical_sulphur` decimal(6,4) DEFAULT NULL,
  `rm_chemical_phosphorus` decimal(6,4) DEFAULT NULL,
  `rm_chemical_chromium` decimal(6,4) DEFAULT NULL,
  `rm_total_offered_qty_mt` decimal(10,3) DEFAULT NULL,
  `rm_offered_qty_erc` int DEFAULT NULL,
  `company_id` int DEFAULT NULL,
  `company_name` varchar(200) DEFAULT NULL,
  `cin` varchar(50) DEFAULT NULL,
  `unit_id` int DEFAULT NULL,
  `unit_name` varchar(100) DEFAULT NULL,
  `unit_address` varchar(500) DEFAULT NULL,
  `unit_gstin` varchar(20) DEFAULT NULL,
  `unit_contact_person` varchar(100) DEFAULT NULL,
  `unit_role` varchar(50) DEFAULT NULL,
  `remarks` text,
  `status` varchar(20) DEFAULT 'PENDING',
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_by` varchar(50) DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_po_no` (`po_no`),
  KEY `idx_po_serial_no` (`po_serial_no`),
  KEY `idx_type_of_call` (`type_of_call`),
  KEY `idx_status` (`status`),
  KEY `idx_company_id` (`company_id`),
  KEY `idx_unit_id` (`unit_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_inspection_request`
--

LOCK TABLES `vendor_inspection_request` WRITE;
/*!40000 ALTER TABLE `vendor_inspection_request` DISABLE KEYS */;
INSERT INTO `vendor_inspection_request` VALUES (1,'PO-2025-1001','PO-2025-1001/01','2025-11-01','ERC MK-III Clips - Type A',5000,'Nos','AMD-001','2025-11-05','Rajesh Kumar','+91-9876543210','Raw Material','2025-12-22',2000,1500,0,'HT-2025-001,HT-2025-002,HT-2025-003',0.4200,0.7500,0.2500,0.0250,0.0300,0.1500,5.500,4786,1,'ABC Industries Pvt Ltd','U27100MH2020PTC123456',101,'Unit 1 - Mumbai','Plot 1, MIDC Industrial Area, Andheri East, Mumbai - 400093','27AABCU9603R1ZM','Rajesh Kumar','ERC Manufacturer','All three heat numbers are from different suppliers. Material quality verified as per IS 2062/IS 1786 standards. Ready for inspection.','PENDING','System','2025-12-18 16:38:46',NULL,'2025-12-18 16:38:46'),(2,'PO-2025-1002','PO-2025-1002/01','2025-11-05','ERC MK-IV Clips - Type B',8000,'Nos','AMD-002','2025-11-10','Suresh Patel','+91-9988776655','Raw Material','2025-12-25',3000,2500,0,'HT-2025-004,HT-2025-005,HT-2025-006',0.3800,0.8200,0.2800,0.0220,0.0280,0.1800,7.250,6312,2,'XYZ Steel Corporation','U27200GJ2019PTC789012',102,'Unit 2 - Ahmedabad','Plot 45, GIDC Industrial Estate, Vatva, Ahmedabad - 382445','24AABCX1234R1ZP','Suresh Patel','ERC Manufacturer','Three heat numbers from approved suppliers. Chemical composition within IS 2062 Grade E250 limits. Ready for RM inspection.','PENDING','System','2025-12-18 16:39:56',NULL,'2025-12-18 16:39:56'),(3,'PO-2025-1003','PO-2025-1003/01','2025-11-08','ERC Standard Clips - Grade C',3500,'Nos',NULL,NULL,'Vikram Singh','+91-8877665544','Raw Material','2025-12-20',1000,500,0,'HT-2025-007,HT-2025-008',0.4500,0.6800,0.2200,0.0280,0.0350,0.1200,4.200,3654,3,'Prime Steel Industries','U27300TN2018PTC456789',103,'Unit 3 - Chennai','Plot 78, SIDCO Industrial Estate, Ambattur, Chennai - 600098','33AABCP5678R1ZQ','Vikram Singh','ERC Manufacturer','Two heat numbers from single supplier. Material tested and verified. No amendment required.','PENDING','System','2025-12-18 16:40:16',NULL,'2025-12-18 16:40:16'),(4,'PO-2025-1004','PO-2025-1004/01','2025-11-12','ERC Premium Clips - Type D',6000,'Nos','AMD-003','2025-11-18','Amit Sharma','+91-7766554433','Raw Material','2025-12-28',1500,1000,0,'HT-2025-009,HT-2025-010',0.4000,0.7200,0.2600,0.0240,0.0320,0.1400,5.800,5046,4,'Metro Steel Works Pvt Ltd','U27400KA2021PTC234567',104,'Unit 4 - Bangalore','Plot 112, Peenya Industrial Area, Phase 3, Bangalore - 560058','29AABCM9012R1ZR','Amit Sharma','ERC Manufacturer','Two heat numbers with premium grade material. Amendment done for revised delivery schedule.','PENDING','System','2025-12-18 16:40:36',NULL,'2025-12-18 16:40:36'),(5,'PO-2025-1005','PO-2025-1005/01','2025-11-15','ERC Basic Clips - Type E',2500,'Nos',NULL,NULL,'Priya Menon','+91-6655443322','Raw Material','2025-12-30',500,0,0,'HT-2025-011',0.4300,0.7000,0.2400,0.0260,0.0340,0.1300,2.500,2175,5,'Southern Alloys Ltd','U27500KL2022PTC345678',105,'Unit 5 - Kochi','Plot 25, Cochin Special Economic Zone, Kakkanad, Kochi - 682037','32AABCS3456R1ZS','Priya Menon','ERC Manufacturer','Single heat number from certified supplier. Small batch order. No amendment required.','PENDING','System','2025-12-18 16:40:55',NULL,'2025-12-18 16:40:55'),(6,'PO-2025-1004','PO-2025-1004/01','2025-11-10','ERC MK-V Clips - Process Stage',6000,'Nos','AMD-004','2025-11-12','Amit Sharma','+91-9876501234','ERC Process','2025-12-23',4500,2000,0,'HT-2025-010,HT-2025-011,HT-2025-012',0.4100,0.7800,0.2600,0.0240,0.0290,0.1600,6.800,5920,4,'Stellar Steel Manufacturing','U27400KA2021PTC234567',104,'Unit 4 - Bangalore','Plot 22, Peenya Industrial Area, Phase 2, Bangalore - 560058','29AABCS2345R1ZR','Amit Sharma','ERC Manufacturer','Process inspection for MK-V clips. RM inspection completed. Ready for shearing and turning stages.','PENDING','System','2025-12-20 16:55:28',NULL,'2025-12-20 16:55:28'),(7,'PO-2025-1005','PO-2025-1005/01','2025-11-12','ERC MK-III Clips - Forging Stage',4500,'Nos','AMD-005','2025-11-15','Priya Reddy','+91-9887654321','ERC Process','2025-12-24',3800,1800,0,'HT-2025-013,HT-2025-014',0.4300,0.7200,0.2400,0.0260,0.0320,0.1400,5.200,4524,5,'Modern Forge Industries','U27500AP2020PTC345678',105,'Unit 5 - Visakhapatnam','Plot 56, APIIC Industrial Park, Gajuwaka, Visakhapatnam - 530026','37AABCM3456R1ZS','Priya Reddy','ERC Manufacturer','Process inspection for forging stage. MK-III clips ready for MPI testing.','PENDING','System','2025-12-20 16:55:28',NULL,'2025-12-20 16:55:28'),(8,'PO-2025-1006','PO-2025-1006/01','2025-11-15','ERC MK-IV Clips - Tempering Stage',5500,'Nos',NULL,NULL,'Karthik Iyer','+91-9776543210','ERC Process','2025-12-25',4200,2500,0,'HT-2025-015,HT-2025-016,HT-2025-017',0.3900,0.8000,0.2700,0.0230,0.0270,0.1700,6.100,5309,6,'Southern Steel Works','U27600TN2019PTC456789',106,'Unit 6 - Coimbatore','Plot 89, SIPCOT Industrial Complex, Sulur, Coimbatore - 641402','33AABCS4567R1ZT','Karthik Iyer','ERC Manufacturer','Process inspection for tempering stage. Heat treatment parameters verified.','PENDING','System','2025-12-20 16:55:28',NULL,'2025-12-20 16:55:28'),(9,'PO-2025-1007','PO-2025-1007/01','2025-11-18','ERC Standard Clips - Hardness Check',3800,'Nos','AMD-006','2025-11-20','Ramesh Gupta','+91-9665432109','ERC Process','2025-12-26',3200,1500,0,'HT-2025-018,HT-2025-019',0.4400,0.6900,0.2300,0.0270,0.0340,0.1300,4.500,3916,7,'Eastern Metal Products','U27700WB2018PTC567890',107,'Unit 7 - Kolkata','Plot 34, Bengal Industrial Park, Howrah - 711103','19AABCE5678R1ZU','Ramesh Gupta','ERC Manufacturer','Process inspection for hardness check. Dimensional inspection completed.','PENDING','System','2025-12-20 16:55:28',NULL,'2025-12-20 16:55:28'),(10,'PO-2025-1008','PO-2025-1008/01','2025-11-20','ERC MK-V Clips - Final Process Stage',7000,'Nos','AMD-007','2025-11-22','Sneha Kulkarni','+91-9554321098','ERC Process','2025-12-27',5800,3200,0,'HT-2025-020,HT-2025-021,HT-2025-022,HT-2025-023',0.4000,0.7600,0.2500,0.0250,0.0300,0.1550,8.200,7137,8,'Western Forge Pvt Ltd','U27800RJ2017PTC678901',108,'Unit 8 - Jaipur','Plot 67, RIICO Industrial Area, Sitapura, Jaipur - 302022','08AABCW6789R1ZV','Sneha Kulkarni','ERC Manufacturer','Final process stage inspection. All manufacturing stages completed. Ready for toe load and visual inspection.','PENDING','System','2025-12-20 16:55:28',NULL,'2025-12-20 16:55:28');
/*!40000 ALTER TABLE `vendor_inspection_request` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workflow_master`
--

DROP TABLE IF EXISTS `workflow_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflow_master` (
  `WORKFLOWID` int NOT NULL AUTO_INCREMENT,
  `WORKFLOWNAME` varchar(150) NOT NULL,
  `CREATEDBY` varchar(50) DEFAULT NULL,
  `CREATEDDATE` datetime DEFAULT NULL,
  PRIMARY KEY (`WORKFLOWID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workflow_master`
--

LOCK TABLES `workflow_master` WRITE;
/*!40000 ALTER TABLE `workflow_master` DISABLE KEYS */;
INSERT INTO `workflow_master` VALUES (1,'INSPECTION CALL','Admin','2025-11-27 11:01:29'),(2,'IE INSPECTION','Admin','2025-11-29 10:50:46');
/*!40000 ALTER TABLE `workflow_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workflow_transition`
--

DROP TABLE IF EXISTS `workflow_transition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflow_transition` (
  `WORKFLOWTRANSITIONID` int NOT NULL AUTO_INCREMENT,
  `WORKFLOWID` int NOT NULL,
  `TRANSITIONID` int NOT NULL,
  `REQUESTID` varchar(100) NOT NULL,
  `CURRENTROLE` varchar(100) DEFAULT NULL,
  `NEXTROLE` varchar(100) DEFAULT NULL,
  `STATUS` varchar(50) DEFAULT NULL,
  `ACTION` varchar(50) DEFAULT NULL,
  `REMARKS` varchar(500) DEFAULT NULL,
  `CREATEDBY` int DEFAULT NULL,
  `CREATEDDATE` datetime DEFAULT NULL,
  `assigned_to_user` int DEFAULT NULL,
  `current_role_Name` varchar(50) DEFAULT NULL,
  `next_role_Name` varchar(50) DEFAULT NULL,
  `job_status` varchar(200) DEFAULT NULL,
  `process_ie_user_id` int DEFAULT NULL,
  `WORKFLOWSEQUENCE` int DEFAULT NULL,
  `modified_by` int DEFAULT NULL,
  PRIMARY KEY (`WORKFLOWTRANSITIONID`)
) ENGINE=InnoDB AUTO_INCREMENT=404 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workflow_transition`
--

LOCK TABLES `workflow_transition` WRITE;
/*!40000 ALTER TABLE `workflow_transition` DISABLE KEYS */;
INSERT INTO `workflow_transition` VALUES (1,1,1,'IC1001','1','2','Created',NULL,NULL,2,'2025-11-27 06:24:03',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(2,1,4,'IC1001','RIO Help Desk','IE','VERIFIED','VERIFY','Inspection Call Verified',2,'2025-11-27 06:28:05',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(3,1,1,'IC1002','1','2','Created',NULL,NULL,2,'2025-11-27 06:29:04',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4,1,2,'IC1002','RIO Help Desk','Vendor','RETURNED','RETURN_TO_VENDOR','',2,'2025-11-27 06:29:51',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(5,1,1,'IC1002','1','2','ReSubmitted','Approved','',2,'2025-11-27 06:46:42',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(6,1,4,'IC1002','RIO Help Desk','IE','VERIFIED','VERIFY','Inspection Call Verified',2,'2025-11-27 06:47:39',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(10,1,1,'IC1005','1','2','Created',NULL,NULL,2,'2025-11-28 05:31:13',4,'Vendor','RIO Help Desk',NULL,NULL,NULL,NULL),(11,1,4,'IC1005','2','3','VERIFIED','VERIFY','Inspection Call Verified',4,'2025-11-28 05:31:52',NULL,'RIO Help Desk','IE',NULL,NULL,NULL,NULL),(12,1,1,'IC1006','1','2','Created',NULL,NULL,2,'2025-11-28 06:23:05',5,'Vendor','RIO Help Desk',NULL,NULL,NULL,NULL),(13,1,4,'IC1006','2','3','VERIFIED','VERIFY','Inspection Call Verified',5,'2025-11-28 06:24:22',NULL,'RIO Help Desk','IE',NULL,NULL,NULL,NULL),(14,1,1,'IC10016','1','2','Created',NULL,NULL,2,'2025-11-28 06:53:55',7,'Vendor','RIO Help Desk',NULL,NULL,NULL,NULL),(15,1,4,'IC10016','2','3','VERIFIED','VERIFY','Inspection Call Verified',7,'2025-11-28 06:54:35',NULL,'RIO Help Desk','IE',NULL,NULL,NULL,NULL),(16,1,1,'IC10017','1','2','Created',NULL,NULL,2,'2025-11-28 07:00:16',9,'Vendor','RIO Help Desk',NULL,NULL,NULL,NULL),(17,1,1,'IC1020','1','2','Created',NULL,NULL,2,'2025-11-28 14:23:36',19,'Vendor','RIO Help Desk',NULL,NULL,NULL,NULL),(18,1,2,'IC1020','2','1','RETURNED','RETURN_TO_VENDOR','Not match the requriment',19,'2025-11-28 14:26:27',NULL,'RIO Help Desk','Vendor',NULL,NULL,NULL,NULL),(19,1,1,'IC1020','1','2','ReSubmitted','Approved','',19,'2025-11-28 14:27:36',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(20,1,4,'IC1020','2','3','VERIFIED','VERIFY','Inspection Call Verified',19,'2025-11-28 14:31:14',13,'RIO Help Desk','IE',NULL,NULL,NULL,NULL),(21,1,1,'IC1021','1','2','Created',NULL,NULL,2,'2025-11-28 14:34:45',19,'Vendor','RIO Help Desk',NULL,NULL,NULL,NULL),(22,1,4,'IC1021','2','3','VERIFIED','VERIFY','Inspection Call Verified',19,'2025-11-28 14:35:12',13,'RIO Help Desk','IE',NULL,NULL,NULL,NULL),(29,2,6,'IC1021','3','3','IE_SCHEDULED','IE_SCHEDULE_CALL','IE has scheduled the call',13,'2025-11-29 06:56:47',13,'IE','IE',NULL,NULL,NULL,NULL),(30,2,6,'IC1021','3','3','INITIATE_INSPECTION','INITIATE_INSPECTION','',13,'2025-11-29 06:58:53',NULL,'IE','IE',NULL,NULL,NULL,NULL),(37,2,9,'IC1021','3','5','REQUEST_CORRECTION_TO_CM','REQUEST_CORRECTION_TO_CM','',13,'2025-11-29 07:24:00',20,'IE','Control Manager',NULL,NULL,NULL,NULL),(39,2,11,'IC1021','5','3','CM_APPROVE_CORRECTION','CM_APPROVE_CORRECTION','',20,'2025-11-29 07:32:15',13,'Control Manager','IE',NULL,NULL,NULL,NULL),(41,2,8,'IC1021','3','3','VERIFY_PO_DETAILS','VERIFY_PO_DETAILS','',13,'2025-11-29 07:48:23',13,'IE','IE',NULL,NULL,NULL,NULL),(44,2,6,'IC1021','3','3','ENTER_SHIFT_DETAILS_AND_START_INSPECTION','ENTER_SHIFT_DETAILS_AND_START_INSPECTION','',13,'2025-11-29 08:02:13',13,'IE','IE',NULL,NULL,NULL,NULL),(45,2,6,'IC1021','3','3','VERIFY_MATERIAL_AVAILABILITY','VERIFY_MATERIAL_AVAILABILITY','',13,'2025-11-29 08:08:19',13,'IE','IE',NULL,NULL,NULL,NULL),(47,2,6,'IC1021','3','3','ENTRY_INSPECTION_RESULTS','ENTRY_INSPECTION_RESULTS','',13,'2025-11-29 08:23:00',13,'IE','IE',NULL,NULL,NULL,NULL),(48,2,6,'IC1021','3','3','PAUSE_INSPECTION_RESUME_NEXT_DAY','PAUSE_INSPECTION_RESUME_NEXT_DAY','',13,'2025-11-29 08:24:43',13,'IE','IE',NULL,NULL,NULL,NULL),(49,2,6,'IC1021','3','3','INSPECTION_COMPLETE_CONFIRM','INSPECTION_COMPLETE_CONFIRM','',13,'2025-11-29 08:25:26',13,'IE','IE',NULL,NULL,NULL,NULL),(50,1,1,'IC1029','1','2','Created',NULL,NULL,2,'2025-11-29 08:57:11',19,'Vendor','RIO Help Desk',NULL,NULL,NULL,NULL),(51,1,4,'IC1029','2','3','VERIFIED','VERIFY','Inspection Call Verified',19,'2025-11-29 08:59:26',13,'RIO Help Desk','IE',NULL,NULL,NULL,NULL),(52,2,6,'IC1029','3','3','IE_SCHEDULED','IE_SCHEDULE_CALL','IE has scheduled the call',13,'2025-11-29 09:00:39',13,'IE','IE',NULL,NULL,NULL,NULL),(53,2,7,'IC1029','3','3','INITIATE_INSPECTION','INITIATE_INSPECTION','',13,'2025-11-29 09:06:41',13,'IE','IE',NULL,NULL,NULL,NULL),(54,2,9,'IC1029','3','5','REQUEST_CORRECTION_TO_CM','REQUEST_CORRECTION_TO_CM','',13,'2025-11-29 09:08:55',20,'IE','Control Manager',NULL,NULL,NULL,NULL),(55,2,11,'IC1029','5','3','CM_APPROVE_CORRECTION','CM_APPROVE_CORRECTION','',20,'2025-11-29 09:38:13',13,'Control Manager','IE',NULL,NULL,NULL,NULL),(56,2,8,'IC1029','3','3','VERIFY_PO_DETAILS','VERIFY_PO_DETAILS','',20,'2025-11-29 09:42:51',13,'IE','IE',NULL,NULL,NULL,NULL),(58,2,10,'IC1029','3','3','ENTER_SHIFT_DETAILS_AND_START_INSPECTION','ENTER_SHIFT_DETAILS_AND_START_INSPECTION','',13,'2025-11-29 09:49:49',13,'IE','IE',NULL,NULL,NULL,NULL),(59,2,15,'IC1029','3','3','VERIFY_MATERIAL_AVAILABILITY','VERIFY_MATERIAL_AVAILABILITY','',13,'2025-11-29 09:51:44',13,'IE','IE',NULL,NULL,NULL,NULL),(60,2,18,'IC1029','3','3','ENTRY_INSPECTION_RESULTS','ENTRY_INSPECTION_RESULTS','',13,'2025-11-29 09:54:22',13,'IE','IE',NULL,NULL,NULL,NULL),(61,2,20,'IC1029','3','3','PAUSE_INSPECTION_RESUME_NEXT_DAY','PAUSE_INSPECTION_RESUME_NEXT_DAY','',13,'2025-11-29 09:57:28',13,'IE','IE',NULL,NULL,NULL,NULL),(62,2,21,'IC1029','3','3','INSPECTION_COMPLETE_CONFIRM','INSPECTION_COMPLETE_CONFIRM','',13,'2025-11-29 10:01:33',13,'IE','IE',NULL,NULL,NULL,NULL),(63,1,1,'IC1030','1','2','Created',NULL,NULL,2,'2025-11-29 10:24:24',19,'Vendor','RIO Help Desk',NULL,NULL,NULL,NULL),(64,1,4,'IC1030','2','3','VERIFIED','VERIFY','Inspection Call Verified',19,'2025-11-29 10:32:11',13,'RIO Help Desk','IE','IN_PROGRESS',NULL,NULL,NULL),(65,2,6,'IC1030','3','3','IE_SCHEDULED','IE_SCHEDULE_CALL','IE has scheduled the call',13,'2025-11-29 10:35:16',13,'IE','IE','ASSIGNED',NULL,NULL,NULL),(66,2,7,'IC1030','3','3','INITIATE_INSPECTION','INITIATE_INSPECTION','',13,'2025-11-29 10:35:51',13,'IE','IE','IN_PROGRESS',NULL,NULL,NULL),(67,2,9,'IC1030','3','5','REQUEST_CORRECTION_TO_CM','REQUEST_CORRECTION_TO_CM','',13,'2025-11-29 10:38:04',20,'IE','Control Manager','IN_PROGRESS',NULL,NULL,NULL),(81,2,11,'IC1030','5','3','CM_APPROVE_CORRECTION','CM_APPROVE_CORRECTION','',20,'2025-12-01 01:36:14',13,'Control Manager','IE','IN_PROGRESS',NULL,NULL,NULL),(82,2,8,'IC1030','3','3','VERIFY_PO_DETAILS','VERIFY_PO_DETAILS','',20,'2025-12-01 01:38:24',13,'IE','IE','VERIFIED',NULL,NULL,NULL),(89,2,10,'IC1030','3','3','ENTER_SHIFT_DETAILS_AND_START_INSPECTION','ENTER_SHIFT_DETAILS_AND_START_INSPECTION','',13,'2025-12-01 02:53:12',13,'IE','IE','IN_PROGRESS',NULL,NULL,NULL),(90,2,15,'IC1030','3','3','BLOCKED','VERIFY_MATERIAL_AVAILABILITY','Blocked - Payment Pending + No Material',13,'2025-12-01 02:53:56',13,'IE','IE','IN_PROGRESS',NULL,NULL,NULL),(91,1,1,'IC1031','1','2','Created',NULL,NULL,2,'2025-12-01 03:16:50',19,'Vendor','RIO Help Desk','Created',NULL,NULL,NULL),(92,1,4,'IC1031','2','3','VERIFIED','VERIFY','Inspection Call Verified',19,'2025-12-01 03:18:12',13,'RIO Help Desk','IE','VERIFIED',NULL,NULL,NULL),(93,2,6,'IC1031','3','3','IE_SCHEDULED','IE_SCHEDULE_CALL','IE has scheduled the call',13,'2025-12-01 03:19:30',13,'IE','IE','ASSIGNED',NULL,NULL,NULL),(94,2,7,'IC1031','3','3','INITIATE_INSPECTION','INITIATE_INSPECTION','',1,'2025-12-01 03:21:27',13,'IE','IE','IN_PROGRESS',NULL,NULL,NULL),(99,2,8,'IC1031','3','3','VERIFY_PO_DETAILS','VERIFY_PO_DETAILS','',13,'2025-12-01 04:34:43',13,'IE','IE','VERIFIED',NULL,NULL,NULL),(100,2,10,'IC1031','3','3','ENTER_SHIFT_DETAILS_AND_START_INSPECTION','ENTER_SHIFT_DETAILS_AND_START_INSPECTION','',13,'2025-12-01 04:35:57',13,'IE','IE','IN_PROGRESS',NULL,NULL,NULL),(105,2,15,'IC1031','3','3','VERIFY_MATERIAL_AVAILABILITY','VERIFY_MATERIAL_AVAILABILITY','',13,'2025-12-01 05:33:18',13,'IE','IE','IN_PROGRESS',NULL,NULL,NULL),(108,2,18,'IC1031','3','3','ENTRY_INSPECTION_RESULTS','ENTRY_INSPECTION_RESULTS','',13,'2025-12-01 05:41:51',13,'IE','IE','IN_PROGRESS',NULL,NULL,NULL),(109,2,20,'IC1031','3','3','PAUSE_INSPECTION_RESUME_NEXT_DAY','PAUSE_INSPECTION_RESUME_NEXT_DAY','',13,'2025-12-01 05:44:46',13,'IE','IE','PAUSED',NULL,NULL,NULL),(112,2,21,'IC1031','3','3','INSPECTION_COMPLETE_CONFIRM','INSPECTION_COMPLETE_CONFIRM','',13,'2025-12-01 05:49:22',13,'IE','IE','COMPLETED',NULL,NULL,NULL),(113,1,1,'IC1032','1','2','Created',NULL,NULL,2,'2025-12-01 06:37:59',19,'Vendor','RIO Help Desk','Created',NULL,NULL,NULL),(114,1,4,'IC1032','2','3','VERIFIED','VERIFY','Inspection Call Verified',19,'2025-12-01 06:39:59',13,'RIO Help Desk','IE','VERIFIED',NULL,NULL,NULL),(120,2,6,'IC1032','3','3','IE_SCHEDULED','IE_SCHEDULE_CALL','IE has scheduled the call',13,'2025-12-01 07:06:02',13,'IE','IE','ASSIGNED',NULL,NULL,NULL),(121,2,7,'IC1032','3','3','INITIATE_INSPECTION','INITIATE_INSPECTION','',13,'2025-12-01 07:07:05',13,'IE','IE','IN_PROGRESS',NULL,NULL,NULL),(139,2,9,'IC1032','3','5','REQUEST_CORRECTION_TO_CM','REQUEST_CORRECTION_TO_CM','',13,'2025-12-01 07:46:36',20,'IE','Control Manager','IN_PROGRESS',NULL,NULL,NULL),(140,2,11,'IC1032','5','3','REQUEST_CORRECTION_TO_CM','REQUEST_CORRECTION_TO_CM','',20,'2025-12-01 07:47:59',13,'Control Manager','IE','IN_PROGRESS',NULL,NULL,NULL),(141,2,10,'IC1032','3','3','VERIFY_PO_DETAILS','VERIFY_PO_DETAILS','',13,'2025-12-01 07:51:25',13,'IE','IE','VERIFIED',NULL,NULL,NULL),(142,2,10,'IC1032','3','3','ENTER_SHIFT_DETAILS_AND_START_INSPECTION','ENTER_SHIFT_DETAILS_AND_START_INSPECTION','',13,'2025-12-01 07:52:41',13,'IE','IE','IN_PROGRESS',NULL,NULL,NULL),(144,2,15,'IC1032','3','3','VERIFY_MATERIAL_AVAILABILITY','VERIFY_MATERIAL_AVAILABILITY','',13,'2025-12-01 07:55:17',13,'IE','IE','IN_PROGRESS',NULL,NULL,NULL),(148,2,18,'IC1032','3','3','ENTRY_INSPECTION_RESULTS','ENTRY_INSPECTION_RESULTS','',13,'2025-12-01 08:02:28',13,'IE','IE','IN_PROGRESS',NULL,NULL,NULL),(149,2,20,'IC1032','3','3','PAUSE_INSPECTION_RESUME_NEXT_DAY','PAUSE_INSPECTION_RESUME_NEXT_DAY','',13,'2025-12-01 08:04:04',13,'IE','IE','PAUSED',NULL,NULL,NULL),(150,2,21,'IC1032','3','3','INSPECTION_COMPLETE_CONFIRM','INSPECTION_COMPLETE_CONFIRM','',13,'2025-12-01 08:04:56',13,'IE','IE','COMPLETED',NULL,NULL,NULL),(151,1,1,'IC1045','1','2','Created',NULL,NULL,2,'2025-12-03 05:15:21',19,'Vendor','RIO Help Desk','Created',NULL,NULL,NULL),(152,1,4,'IC1045','2','3','VERIFIED','VERIFY','Inspection Call Verified',19,'2025-12-03 05:18:20',13,'RIO Help Desk','IE','VERIFIED',NULL,NULL,NULL),(153,2,6,'IC1045','3','3','IE_SCHEDULED','IE_SCHEDULE_CALL','IE has scheduled the call',13,'2025-12-03 05:19:11',13,'IE','IE','ASSIGNED',NULL,NULL,NULL),(154,2,7,'IC1045','3','3','INITIATE_INSPECTION','INITIATE_INSPECTION','',13,'2025-12-03 05:20:47',13,'IE','IE','IN_PROGRESS',NULL,NULL,NULL),(155,2,9,'IC1045','3','5','REQUEST_CORRECTION_TO_CM','REQUEST_CORRECTION_TO_CM','',13,'2025-12-03 05:21:51',20,'IE','Control Manager','APPROVED',NULL,NULL,NULL),(157,2,12,'IC1045','5','3','CM_REJECT_CORRECTION','CM_REJECT_CORRECTION','',20,'2025-12-03 05:27:24',13,'Control Manager','IE','REJECTED',NULL,NULL,NULL),(158,2,27,'IC1045','3','null','CANCELLED','CANCEL_CALL','',13,'2025-12-03 05:37:17',13,'IE',NULL,'CANCELLED',NULL,NULL,NULL),(159,1,1,'IC1046','1','2','Created',NULL,NULL,2,'2025-12-03 06:33:14',19,'Vendor','RIO Help Desk','Created',NULL,NULL,NULL),(163,1,4,'IC1046','2','3','VERIFIED','VERIFY','Inspection Call Verified',19,'2025-12-03 07:13:48',19,'RIO Help Desk','IE','VERIFIED',NULL,NULL,NULL),(164,1,31,'IC1046','2','6','PAYMENT_VERIFICATION','VERIFY','Awaiting Finance Verification',19,'2025-12-03 07:13:48',1,'RIO Help Desk','Rio Finance','VERIFIED',NULL,NULL,NULL),(165,1,32,'IC1046','6','6','PARKED','PARKED_PAYMENT_NOT_RECEIVED','Payment Not Received',1,'2025-12-03 07:16:18',1,'Rio Finance','Rio Finance','IN_PROGRESS',NULL,NULL,NULL),(166,1,33,'IC1046','6','3','CALL_REGISTERED','CALL_REGISTERED','Payment Received - Call Registered',1,'2025-12-03 07:16:48',13,'Rio Finance','IE','REGISTERED',NULL,NULL,NULL),(167,2,6,'IC1046','3','3','IE_SCHEDULED','IE_SCHEDULE_CALL','IE has scheduled the call',13,'2025-12-03 07:18:50',13,'IE','IE','ASSIGNED',NULL,NULL,NULL),(168,1,1,'IC1048','1','2','Created',NULL,NULL,2,'2025-12-03 07:20:09',19,'Vendor','RIO Help Desk','Created',NULL,NULL,NULL),(169,1,4,'IC1048','2','3','VERIFIED','VERIFY','Inspection Call Verified',19,'2025-12-03 07:21:47',19,'RIO Help Desk','IE','VERIFIED',NULL,NULL,NULL),(170,1,33,'IC1048','6','3','CALL_REGISTERED','VERIFY','Call Registered',19,'2025-12-03 07:21:47',13,'Rio Finance','IE','VERIFIED',NULL,NULL,NULL),(171,1,1,'IC1050','1','2','Created',NULL,NULL,2,'2025-12-03 08:06:25',19,'Vendor','RIO Help Desk','Created',NULL,NULL,NULL),(172,1,4,'IC1050','2','3','VERIFIED','VERIFY','Inspection Call Verified',19,'2025-12-03 08:16:45',19,'RIO Help Desk','IE','VERIFIED',NULL,NULL,NULL),(173,1,33,'IC1050','6','3','CALL_REGISTERED','VERIFY','Call Registered',19,'2025-12-03 08:16:45',13,'Rio Finance','IE','VERIFIED',NULL,NULL,NULL),(174,2,6,'IC1050','3','3','IE_SCHEDULED','IE_SCHEDULE_CALL','IE has scheduled the call',13,'2025-12-03 08:20:15',13,'IE','IE','ASSIGNED',NULL,NULL,NULL),(175,2,7,'IC1050','3','3','INITIATE_INSPECTION','INITIATE_INSPECTION','',13,'2025-12-03 08:23:41',13,'IE','IE','IN_PROGRESS',NULL,NULL,NULL),(176,2,9,'IC1050','3','5','REQUEST_CORRECTION_TO_CM','REQUEST_CORRECTION_TO_CM','',13,'2025-12-03 08:25:13',20,'IE','Control Manager','APPROVED',NULL,NULL,NULL),(181,2,11,'IC1050','5','3','CM_APPROVE_CORRECTION','CM_APPROVE_CORRECTION','',20,'2025-12-03 08:50:54',13,'Control Manager','IE','IN_PROGRESS',NULL,NULL,NULL),(182,2,10,'IC1050','3','3','VERIFY_PO_DETAILS','VERIFY_PO_DETAILS','',13,'2025-12-03 09:00:38',13,'IE','IE','VERIFIED',NULL,NULL,NULL),(183,2,10,'IC1050','3','3','ENTER_SHIFT_DETAILS_AND_START_INSPECTION','ENTER_SHIFT_DETAILS_AND_START_INSPECTION','',13,'2025-12-03 09:01:56',13,'IE','IE','IN_PROGRESS',NULL,NULL,NULL),(186,2,15,'IC1050','3','3','VERIFY_MATERIAL_AVAILABILITY','VERIFY_MATERIAL_AVAILABILITY','',13,'2025-12-03 09:06:34',13,'IE','IE','IN_PROGRESS',NULL,NULL,NULL),(197,2,34,'IC1050','3','3','ENTRY_RESULTS_PARTIAL_NOK','ENTRY_RESULTS_PARTIAL_NOK','',13,'2025-12-03 09:35:46',13,'IE','IE','IN_PROGRESS',NULL,NULL,NULL),(198,2,20,'IC1050','3','3','PAUSE_INSPECTION_RESUME_NEXT_DAY','PAUSE_INSPECTION_RESUME_NEXT_DAY','',13,'2025-12-03 09:38:00',13,'IE','IE','PAUSED',NULL,NULL,NULL),(199,2,21,'IC1050','3','3','INSPECTION_COMPLETE_CONFIRM','INSPECTION_COMPLETE_CONFIRM','',13,'2025-12-03 09:40:33',13,'IE','IE','COMPLETED',NULL,NULL,NULL),(200,1,1,'IC1051','1','2','Created',NULL,NULL,2,'2025-12-04 05:01:11',19,'Vendor','RIO Help Desk','Created',NULL,NULL,NULL),(201,1,2,'IC1051','2','1','RETURNED','RETURN_TO_VENDOR','need clarity',19,'2025-12-04 05:03:21',19,'RIO Help Desk','Vendor','IN_PROGRESS',NULL,NULL,NULL),(203,1,1,'IC1051','1','2','ReSubmitted','Approved','clarified',2,'2025-12-04 05:15:31',19,'Vendor','RIO Help Desk',NULL,NULL,NULL,NULL),(204,1,3,'IC1051','2','2','ROUTED_CORRECTION','FIX_ROUTING','Routing corrected & forwarded to correct RIO',19,'2025-12-04 05:27:04',1,'RIO Help Desk','RIO Help Desk','IN_PROGRESS',NULL,NULL,NULL),(207,1,4,'IC1051','2','3','VERIFIED','VERIFY','Inspection Call Verified',1,'2025-12-04 05:34:19',1,'RIO Help Desk','IE','VERIFIED',NULL,NULL,NULL),(208,1,31,'IC1051','2','6','PAYMENT_VERIFICATION','VERIFY','Awaiting Finance Verification',1,'2025-12-04 05:34:19',1,'RIO Help Desk','Rio Finance','VERIFIED',NULL,NULL,NULL),(212,1,32,'IC1051','6','6','PARKED','PAYMENT_VERIFICATION','Payment Not Received',1,'2025-12-04 05:51:45',1,'Rio Finance','Rio Finance','IN_PROGRESS',NULL,NULL,NULL),(213,1,33,'IC1051','6','3','CALL_REGISTERED','PAYMENT_VERIFICATION','Payment Verified - Call Registered',1,'2025-12-04 05:52:53',13,'Rio Finance','IE','REGISTERED',NULL,NULL,NULL),(215,1,5,'IC1051','4','3','RETURNED_BY_CM','CM_RETURN_TO_IE','',12,'2025-12-04 06:19:31',20,'IE Secondary','IE',NULL,NULL,NULL,NULL),(216,1,1,'IC1052','1','2','Created',NULL,NULL,2,'2025-12-04 07:01:48',19,'Vendor','RIO Help Desk','Created',NULL,NULL,NULL),(217,1,1,'IC1053','1','2','Created',NULL,NULL,2,'2025-12-04 08:03:48',19,'Vendor','RIO Help Desk','Created',NULL,NULL,NULL),(239,1,4,'IC1053','2','7','VERIFIED','VERIFY','Inspection Call Verified',19,'2025-12-04 09:10:20',19,'RIO Help Desk','Process IE','VERIFIED',NULL,NULL,NULL),(240,1,33,'IC1053','6','7','CALL_REGISTERED','VERIFY','Call Registered',19,'2025-12-04 09:10:20',21,'Rio Finance','Process IE','VERIFIED',21,NULL,NULL),(242,2,6,'IC1053','3','3','IE_SCHEDULED','IE_SCHEDULE_CALL','IE has scheduled the call',13,'2025-12-04 09:13:11',13,'IE','IE','ASSIGNED',21,NULL,NULL),(244,2,7,'IC1053','7','7','INITIATE_INSPECTION','INITIATE_INSPECTION','',13,'2025-12-04 09:16:57',13,'Process IE','Process IE','IN_PROGRESS',21,NULL,NULL),(245,2,9,'IC1053','7','5','REQUEST_CORRECTION_TO_CM','REQUEST_CORRECTION_TO_CM','',21,'2025-12-04 09:23:01',20,'Process IE','Control Manager','APPROVED',21,NULL,NULL),(249,2,11,'IC1053','5','7','CM_APPROVE_CORRECTION','CM_APPROVE_CORRECTION','',20,'2025-12-04 09:57:08',21,'Control Manager','Process IE','IN_PROGRESS',21,NULL,NULL),(250,2,10,'IC1053','7','7','VERIFY_PO_DETAILS','VERIFY_PO_DETAILS','',20,'2025-12-04 09:58:34',21,'Process IE','Process IE','VERIFIED',21,NULL,NULL),(251,2,10,'IC1053','7','7','ENTER_SHIFT_DETAILS_AND_START_INSPECTION','ENTER_SHIFT_DETAILS_AND_START_INSPECTION','',20,'2025-12-04 10:00:05',21,'Process IE','Process IE','IN_PROGRESS',21,NULL,NULL),(260,2,34,'IC1053','7','7','ENTRY_RESULTS_PARTIAL_NOK','ENTRY_RESULTS_PARTIAL_NOK','',20,'2025-12-04 10:20:54',21,'Process IE','Process IE','IN_PROGRESS',21,NULL,NULL),(261,1,1,'IC1054','1','2','Created',NULL,NULL,2,'2025-12-05 05:17:26',19,'Vendor','RIO Help Desk','Created',NULL,1,NULL),(264,1,3,'IC1054','2','2','ROUTED_CORRECTION','FIX_ROUTING','Routing corrected & forwarded to correct RIO',19,'2025-12-05 05:30:39',19,'RIO Help Desk','RIO Help Desk','IN_PROGRESS',NULL,2,NULL),(265,1,2,'IC1054','2','1','RETURNED','RETURN_TO_VENDOR','need to chnags',19,'2025-12-05 05:35:13',19,'RIO Help Desk','Vendor','IN_PROGRESS',NULL,3,NULL),(267,1,1,'IC1054','1','2','ReSubmitted','Approved','',19,'2025-12-05 05:40:20',19,'Vendor','RIO Help Desk','IN_PROGRESS',NULL,NULL,NULL),(268,1,1,'IC1056','1','2','Created',NULL,NULL,2,'2025-12-05 05:41:24',19,'Vendor','RIO Help Desk','Created',NULL,1,NULL),(269,1,3,'IC1056','2','2','ROUTED_CORRECTION','FIX_ROUTING','Routing corrected & forwarded to correct RIO',19,'2025-12-05 05:43:16',19,'RIO Help Desk','RIO Help Desk','IN_PROGRESS',NULL,2,NULL),(270,1,2,'IC1056','2','1','RETURNED','RETURN_TO_VENDOR','',19,'2025-12-05 06:15:23',2,'RIO Help Desk','Vendor','IN_PROGRESS',NULL,3,NULL),(272,1,1,'IC1056','1','2','ReSubmitted','Approved','',2,'2025-12-05 06:18:11',19,'Vendor','RIO Help Desk','IN_PROGRESS',NULL,4,NULL),(277,1,4,'IC1056','2','3','VERIFIED','VERIFY','Inspection Call Verified',19,'2025-12-05 06:32:32',19,'RIO Help Desk','IE','VERIFIED',NULL,5,NULL),(278,1,37,'IC1056','2','6','PAYMENT_VERIFICATION','VERIFY','Awaiting Finance Verification',19,'2025-12-05 06:32:32',1,'RIO Help Desk','Rio Finance','VERIFIED',NULL,6,NULL),(281,1,38,'IC1056','6','6','PARKED','PAYMENT_VERIFICATION','Payment Not Received',1,'2025-12-05 06:36:12',1,'Rio Finance','Rio Finance','IN_PROGRESS',NULL,7,NULL),(282,1,33,'IC1056','6','3','CALL_REGISTERED','PAYMENT_VERIFICATION','Payment Verified - Call Registered',1,'2025-12-05 06:36:59',13,'Rio Finance','IE','REGISTERED',NULL,8,NULL),(284,2,6,'IC1056','3','3','IE_SCHEDULED','IE_SCHEDULE_CALL','IE has scheduled the call',13,'2025-12-05 06:42:08',13,'IE','IE','ASSIGNED',NULL,9,NULL),(285,2,7,'IC1056','3','3','INITIATE_INSPECTION','INITIATE_INSPECTION','',13,'2025-12-05 06:43:41',13,'IE','IE','IN_PROGRESS',NULL,10,NULL),(286,2,9,'IC1056','3','5','REQUEST_CORRECTION_TO_CM','REQUEST_CORRECTION_TO_CM','',13,'2025-12-05 06:44:40',20,'IE','Control Manager','APPROVED',NULL,11,NULL),(290,2,11,'IC1056','5','3','CM_APPROVE_CORRECTION','CM_APPROVE_CORRECTION','',20,'2025-12-05 07:10:05',13,'Control Manager','IE','IN_PROGRESS',NULL,12,NULL),(291,2,10,'IC1056','3','3','VERIFY_PO_DETAILS','VERIFY_PO_DETAILS','',13,'2025-12-05 07:13:44',13,'IE','IE','VERIFIED',NULL,13,NULL),(292,2,10,'IC1056','3','3','ENTER_SHIFT_DETAILS_AND_START_INSPECTION','ENTER_SHIFT_DETAILS_AND_START_INSPECTION','',13,'2025-12-05 07:14:31',13,'IE','IE','IN_PROGRESS',NULL,14,NULL),(296,2,15,'IC1056','3','3','VERIFY_MATERIAL_AVAILABILITY','VERIFY_MATERIAL_AVAILABILITY','',13,'2025-12-05 07:20:21',13,'IE','IE','IN_PROGRESS',NULL,15,NULL),(297,1,1,'IC1090','1','2','Created',NULL,NULL,2,'2025-12-05 08:09:39',19,'Vendor','RIO Help Desk','Created',NULL,1,NULL),(299,1,3,'IC1090','2','2','ROUTED_CORRECTION','FIX_ROUTING','Routing corrected & forwarded to correct RIO',19,'2025-12-05 08:18:17',1,'RIO Help Desk','RIO Help Desk','IN_PROGRESS',NULL,2,NULL),(300,1,2,'IC1090','2','1','RETURNED','RETURN_TO_VENDOR','need clarity on POI',1,'2025-12-05 08:20:43',2,'RIO Help Desk','Vendor','IN_PROGRESS',NULL,3,NULL),(301,1,1,'IC1090','1','2','ReSubmitted','Approved','',2,'2025-12-05 08:22:44',19,'Vendor','RIO Help Desk','IN_PROGRESS',NULL,4,NULL),(302,1,4,'IC1090','2','3','VERIFIED','VERIFY','Inspection Call Verified',19,'2025-12-05 08:24:40',19,'RIO Help Desk','IE','VERIFIED',NULL,5,NULL),(303,1,37,'IC1090','2','6','PAYMENT_VERIFICATION','VERIFY','Awaiting Finance Verification',19,'2025-12-05 08:24:40',1,'RIO Help Desk','Rio Finance','VERIFIED',NULL,6,NULL),(304,1,38,'IC1090','6','6','PARKED','PAYMENT_VERIFICATION','Payment Not Received',1,'2025-12-05 08:28:41',1,'Rio Finance','Rio Finance','IN_PROGRESS',NULL,7,NULL),(305,1,33,'IC1090','6','3','CALL_REGISTERED','PAYMENT_VERIFICATION','Payment Verified - Call Registered',1,'2025-12-05 08:29:15',13,'Rio Finance','IE','REGISTERED',NULL,8,NULL),(306,2,6,'IC1090','3','3','IE_SCHEDULED','IE_SCHEDULE_CALL','IE has scheduled the call',13,'2025-12-05 08:35:52',13,'IE','IE','ASSIGNED',NULL,9,NULL),(307,1,1,'IC1093','1','2','Created',NULL,NULL,2,'2025-12-08 05:37:09',19,'Vendor','RIO Help Desk','Created',NULL,1,NULL),(316,1,4,'IC1093','2','3','VERIFIED','VERIFY','Inspection Call Verified',19,'2025-12-08 06:01:25',19,'RIO Help Desk','IE','VERIFIED',NULL,2,NULL),(317,1,37,'IC1093','2','6','PAYMENT_VERIFICATION','VERIFY','Awaiting Finance Verification',19,'2025-12-08 06:01:25',1,'RIO Help Desk','Rio Finance','VERIFIED',NULL,3,NULL),(318,1,33,'IC1093','6','3','CALL_REGISTERED','PAYMENT_VERIFICATION','Payment Verified - Call Registered',1,'2025-12-08 06:08:33',13,'Rio Finance','IE','REGISTERED',NULL,4,NULL),(319,1,42,'IC1093','1','5','QTY_EDIT_REQUESTED','REQUEST_QTY_EDIT','',1,'2025-12-08 06:13:43',20,'Vendor','Control Manager','IN_PROGRESS',NULL,5,NULL),(321,1,44,'IC1093','5','1','QTY_APPROVED','CM_QTY_DECISION','',1,'2025-12-08 06:18:26',1,'Control Manager','Vendor','IN_PROGRESS',NULL,6,NULL),(322,2,6,'IC1093','3','3','IE_SCHEDULED','IE_SCHEDULE_CALL','IE has scheduled the call',13,'2025-12-08 06:31:46',13,'IE','IE','ASSIGNED',NULL,5,NULL),(323,1,1,'IC1094','1','2','Created',NULL,NULL,2,'2025-12-08 06:37:48',19,'Vendor','RIO Help Desk','Created',NULL,1,NULL),(324,1,4,'IC1094','2','3','VERIFIED','Verify','Inspection Call Verified',19,'2025-12-08 06:44:56',19,'RIO Help Desk','IE','VERIFIED',NULL,2,NULL),(325,1,37,'IC1094','2','6','PAYMENT_VERIFICATION','Verify','Awaiting Finance Verification',19,'2025-12-08 06:44:56',1,'RIO Help Desk','Rio Finance','VERIFIED',NULL,3,NULL),(326,1,33,'IC1094','6','3','CALL_REGISTERED','PAYMENT_VERIFICATION','Payment Verified - Call Registered',19,'2025-12-08 06:46:31',13,'Rio Finance','IE','REGISTERED',NULL,4,NULL),(327,2,6,'IC1094','3','3','IE_SCHEDULED','IE_SCHEDULE_CALL','IE has scheduled the call',13,'2025-12-08 06:46:56',13,'IE','IE','ASSIGNED',NULL,5,NULL),(335,1,42,'IC1094','1','5','QTY_EDIT_REQUESTED','REQUEST_QTY_EDIT','',2,'2025-12-08 07:02:01',20,'Vendor','Control Manager','IN_PROGRESS',NULL,6,NULL),(337,1,44,'IC1094','5','1','QTY_APPROVED','CM_QTY_DECISION','',20,'2025-12-08 07:33:49',2,'Control Manager','Vendor','IN_PROGRESS',NULL,7,NULL),(338,2,7,'IC1094','3','3','INITIATE_INSPECTION','INITIATE_INSPECTION','',13,'2025-12-08 08:06:55',13,'IE','IE','IN_PROGRESS',NULL,8,NULL),(339,1,1,'IC1088','1','2','Created',NULL,NULL,2,'2025-12-08 11:26:32',19,'Vendor','RIO Help Desk','Created',NULL,1,NULL),(342,1,3,'IC1088','2','2','ROUTED_CORRECTION','FIX_ROUTING','Routing corrected & forwarded to correct RIO',2,'2025-12-08 11:40:52',1,'RIO Help Desk','RIO Help Desk','IN_PROGRESS',NULL,2,19),(344,1,1,'IC1088','1','2','ReSubmitted','Approved','',2,'2025-12-08 11:48:48',19,'Vendor','RIO Help Desk','IN_PROGRESS',NULL,3,1),(345,1,2,'IC1088','2','1','RETURNED','RETURN_TO_VENDOR','remarks',2,'2025-12-08 11:50:36',2,'RIO Help Desk','Vendor','IN_PROGRESS',NULL,4,19),(346,1,1,'IC1088','1','2','ReSubmitted','Approved','',2,'2025-12-08 11:53:53',19,'Vendor','RIO Help Desk','IN_PROGRESS',NULL,5,2),(347,1,4,'IC1088','2','3','VERIFIED','VERIFY','Inspection Call Verified',2,'2025-12-08 11:55:21',19,'RIO Help Desk','IE','VERIFIED',NULL,6,19),(348,1,37,'IC1088','2','6','PAYMENT_VERIFICATION','VERIFY','Awaiting Finance Verification',2,'2025-12-08 11:55:21',1,'RIO Help Desk','Rio Finance','VERIFIED',NULL,7,19),(349,1,33,'IC1088','6','3','CALL_REGISTERED','PAYMENT_VERIFICATION','Payment Verified - Call Registered',2,'2025-12-08 11:59:58',13,'Rio Finance','IE','REGISTERED',NULL,8,1),(353,1,5,'IC1088','4','3','RETURNED_BY_CM','CM_RETURN_TO_IE','',2,'2025-12-08 12:31:07',13,'IE Secondary','IE','ASSIGNED',NULL,8,20),(354,1,42,'IC1088','1','5','QTY_EDIT_REQUESTED','REQUEST_QTY_EDIT','',2,'2025-12-09 05:12:53',20,'Vendor','Control Manager','IN_PROGRESS',NULL,9,2),(355,2,6,'IC1088','3','3','IE_SCHEDULED','IE_SCHEDULE_CALL','IE has scheduled the call',13,'2025-12-09 05:19:52',13,'IE','IE','ASSIGNED',NULL,9,NULL),(356,2,7,'IC1088','3','3','INITIATE_INSPECTION','INITIATE_INSPECTION','',13,'2025-12-09 05:24:27',13,'IE','IE','IN_PROGRESS',NULL,10,13),(362,2,8,'IC1088','3','3','VERIFY_PO_DETAILS','VERIFY_PO_DETAILS','',13,'2025-12-09 05:40:52',13,'IE','IE','VERIFIED',NULL,11,13),(363,2,10,'IC1088','3','3','ENTER_SHIFT_DETAILS_AND_START_INSPECTION','ENTER_SHIFT_DETAILS_AND_START_INSPECTION','',13,'2025-12-09 05:41:47',13,'IE','IE','IN_PROGRESS',NULL,12,13),(367,2,15,'IC1088','3','3','VERIFY_MATERIAL_AVAILABILITY','VERIFY_MATERIAL_AVAILABILITY','',13,'2025-12-09 05:47:02',13,'IE','IE','IN_PROGRESS',NULL,13,13),(372,2,18,'IC1088','3','3','ENTRY_INSPECTION_RESULTS','ENTRY_INSPECTION_RESULTS','',13,'2025-12-09 06:00:48',13,'IE','IE','IN_PROGRESS',NULL,14,13),(373,2,20,'IC1088','3','3','PAUSE_INSPECTION_RESUME_NEXT_DAY','PAUSE_INSPECTION_RESUME_NEXT_DAY','',13,'2025-12-09 06:02:10',13,'IE','IE','PAUSED',NULL,15,13),(375,2,21,'IC1088','3','3','INSPECTION_COMPLETE_CONFIRM','INSPECTION_COMPLETE_CONFIRM','',13,'2025-12-09 06:04:10',13,'IE','IE','COMPLETED',NULL,16,13),(376,1,1,'IC2004','1','2','Created',NULL,NULL,2,'2025-12-10 06:03:08',19,'Vendor','RIO Help Desk','Created',NULL,1,NULL),(377,1,4,'IC2004','2','3','VERIFIED','VERIFY','Inspection Call Verified',2,'2025-12-10 06:35:16',19,'RIO Help Desk','IE','VERIFIED',NULL,2,19),(378,1,37,'IC2004','2','6','PAYMENT_VERIFICATION','VERIFY','Awaiting Finance Verification',2,'2025-12-10 06:35:16',1,'RIO Help Desk','Rio Finance','VERIFIED',NULL,3,19),(379,1,1,'IC3000','1','2','Created',NULL,NULL,2,'2025-12-10 07:13:26',19,'Vendor','RIO Help Desk','Created',NULL,1,NULL),(380,1,2,'IC3000','2','1','RETURNED','RETURN_TO_VENDOR','please change poi',2,'2025-12-10 07:17:53',2,'RIO Help Desk','Vendor','IN_PROGRESS',NULL,2,19),(381,1,1,'IC23','1','2','Created',NULL,NULL,2,'2025-12-12 06:27:44',19,'Vendor','RIO Help Desk','Created',NULL,1,NULL),(382,1,4,'IC23','2','3','VERIFIED','VERIFY','Inspection Call Verified',2,'2025-12-12 06:29:22',19,'RIO Help Desk','IE','VERIFIED',NULL,2,19),(383,1,37,'IC23','2','6','PAYMENT_VERIFICATION','VERIFY','Awaiting Finance Verification',2,'2025-12-12 06:29:22',1,'RIO Help Desk','Rio Finance','VERIFIED',NULL,3,19),(384,1,33,'IC23','6','3','CALL_REGISTERED','PAYMENT_VERIFICATION','Payment Verified - Call Registered',2,'2025-12-12 06:32:50',13,'Rio Finance','IE','REGISTERED',NULL,4,1),(385,2,6,'IC23','3','3','IE_SCHEDULED','IE_SCHEDULE_CALL','IE has scheduled the call',13,'2025-12-12 06:34:57',13,'IE','IE','ASSIGNED',NULL,5,NULL),(392,2,46,'IC23','3','5','IE_REQUEST_RESCHEDULE','IE_REQUEST_RESCHEDULE','string',13,'2025-12-12 06:51:07',20,'IE','Control Manager','IN_PROGRESS',NULL,6,13),(394,2,49,'IC23','5','8','CM_FORWARD_TO_SBU_HEAD','CM_FORWARD_TO_SBU_HEAD','string',13,'2025-12-12 06:57:55',29,'Control Manager','SBU Head','IN_PROGRESS',NULL,7,20),(398,2,51,'IC23','8','3','SBU_HEAD_REJECT_RESCHEDULE','SBU_HEAD_REJECT_RESCHEDULE','string',13,'2025-12-12 07:24:54',13,'SBU Head','IE','IN_PROGRESS',NULL,8,29),(399,1,1,'IC24','1','2','Created',NULL,NULL,2,'2025-12-12 07:55:46',19,'Vendor','RIO Help Desk','Created',NULL,1,NULL),(400,1,4,'IC24','2','3','VERIFIED','VERIFY','Inspection Call Verified',2,'2025-12-12 07:58:31',19,'RIO Help Desk','IE','VERIFIED',NULL,2,19),(401,1,37,'IC24','2','6','PAYMENT_VERIFICATION','VERIFY','Awaiting Finance Verification',2,'2025-12-12 07:58:31',1,'RIO Help Desk','Rio Finance','VERIFIED',NULL,3,19),(402,1,33,'IC24','6','3','CALL_REGISTERED','PAYMENT_VERIFICATION','Payment Verified - Call Registered',2,'2025-12-12 07:59:27',13,'Rio Finance','IE','REGISTERED',NULL,4,1),(403,2,6,'IC24','3','3','IE_SCHEDULED','IE_SCHEDULE_CALL','IE has scheduled the call',13,'2025-12-12 08:01:04',13,'IE','IE','ASSIGNED',NULL,5,NULL);
/*!40000 ALTER TABLE `workflow_transition` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-20 23:10:41
