-- AlterTable
ALTER TABLE `order` ADD COLUMN `printedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `Order_printedAt_idx` ON `Order`(`printedAt`);
