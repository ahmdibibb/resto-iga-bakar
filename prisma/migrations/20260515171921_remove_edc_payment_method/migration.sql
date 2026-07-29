/*
  Warnings:

  - The values [EDC] on the enum `Payment_method` will be removed. If these variants are still used in the database, this will fail.
  - The values [EDC] on the enum `Payment_method` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `order` MODIFY `payment_method` ENUM('CASH', 'QRIS') NULL;

-- AlterTable
ALTER TABLE `payment` MODIFY `method` ENUM('CASH', 'QRIS') NOT NULL;
