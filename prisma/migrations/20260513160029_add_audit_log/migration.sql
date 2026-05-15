-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NOT NULL,
    `userRole` ENUM('OWNER', 'ADMIN', 'USER', 'KASIR') NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `resource` VARCHAR(191) NOT NULL,
    `result` VARCHAR(191) NOT NULL,
    `metadata` TEXT NULL,

    INDEX `AuditLog_userId_idx`(`userId`),
    INDEX `AuditLog_userRole_idx`(`userRole`),
    INDEX `AuditLog_action_idx`(`action`),
    INDEX `AuditLog_resource_idx`(`resource`),
    INDEX `AuditLog_timestamp_idx`(`timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
