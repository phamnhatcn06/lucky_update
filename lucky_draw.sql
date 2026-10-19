/*
 Navicat Premium Data Transfer

 Source Server         : Localhost
 Source Server Type    : MySQL
 Source Server Version : 50724
 Source Host           : localhost:3306
 Source Schema         : lucky_draw

 Target Server Type    : MySQL
 Target Server Version : 50724
 File Encoding         : 65001

 Date: 31/03/2026 15:17:18
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for participants
-- ----------------------------
DROP TABLE IF EXISTS `participants`;
CREATE TABLE `participants`  (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `department` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `company` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_partner` tinyint(1) NULL DEFAULT 0,
  `level` int(11) NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `code`(`code`) USING BTREE,
  INDEX `idx_participants_active`(`is_active`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 777 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of participants
-- ----------------------------

-- ----------------------------
-- Table structure for prizes
-- ----------------------------
DROP TABLE IF EXISTS `prizes`;
CREATE TABLE `prizes`  (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `prize_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `prize_order` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `duration` int(11) NULL DEFAULT NULL,
  `stagger_duration` int(11) NULL DEFAULT 0,
  `exclude_levels` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `spin_count` int(11) NULL DEFAULT 1,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_prize_order`(`prize_order`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of prizes
-- ----------------------------
INSERT INTO `prizes` VALUES (1, 'Giải Đặc Biệt', 5, 1, '2026-01-23 13:24:50', 'special', 12000, 0, NULL, 1);
INSERT INTO `prizes` VALUES (2, 'Giải Nhất', 4, 10, '2026-01-23 13:24:50', 'first', 15000, 5000, NULL, 5);
INSERT INTO `prizes` VALUES (3, 'Giải Nhì', 3, 20, '2026-01-23 13:24:50', 'second', 5000, 0, NULL, 10);
INSERT INTO `prizes` VALUES (4, 'Giải Ba', 2, 30, '2026-01-23 13:24:50', 'third', 10000, 0, NULL, 10);

-- ----------------------------
-- Table structure for settings
-- ----------------------------
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings`  (
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`name`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of settings
-- ----------------------------
INSERT INTO `settings` VALUES ('access_code', 'YEP6868');
INSERT INTO `settings` VALUES ('background_path', '');
INSERT INTO `settings` VALUES ('current_prize_id', '1');
INSERT INTO `settings` VALUES ('event_title', 'Lucky Draw');
INSERT INTO `settings` VALUES ('exclude_active', '1');
INSERT INTO `settings` VALUES ('exclude_keyword', 'Nhà thầu');
INSERT INTO `settings` VALUES ('exclude_partners', '1');
INSERT INTO `settings` VALUES ('remote_command', '');

-- ----------------------------
-- Table structure for winners
-- ----------------------------
DROP TABLE IF EXISTS `winners`;
CREATE TABLE `winners`  (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `prize_id` bigint(20) UNSIGNED NOT NULL,
  `participant_id` bigint(20) UNSIGNED NOT NULL,
  `won_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `confirm` tinyint(4) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_prize_participant`(`prize_id`, `participant_id`) USING BTREE,
  UNIQUE INDEX `uq_participant_once`(`participant_id`) USING BTREE,
  INDEX `idx_winners_prize`(`prize_id`) USING BTREE,
  CONSTRAINT `fk_w_participant` FOREIGN KEY (`participant_id`) REFERENCES `participants` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_w_prize` FOREIGN KEY (`prize_id`) REFERENCES `prizes` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 642 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of winners
-- ----------------------------

SET FOREIGN_KEY_CHECKS = 1;
