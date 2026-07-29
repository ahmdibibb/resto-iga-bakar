-- CreateIndex
CREATE INDEX `Order_createdAt_idx` ON `Order`(`createdAt`);

-- CreateIndex
CREATE INDEX `Order_orderType_idx` ON `Order`(`orderType`);

-- CreateIndex
CREATE INDEX `Order_payment_method_idx` ON `Order`(`payment_method`);

-- CreateIndex
CREATE INDEX `StockHistory_createdAt_idx` ON `StockHistory`(`createdAt`);

-- RenameIndex
ALTER TABLE `order` RENAME INDEX `Order_userId_fkey` TO `Order_userId_idx`;

-- RenameIndex
ALTER TABLE `orderitem` RENAME INDEX `OrderItem_orderId_fkey` TO `OrderItem_orderId_idx`;

-- RenameIndex
ALTER TABLE `orderitem` RENAME INDEX `OrderItem_productId_fkey` TO `OrderItem_productId_idx`;

-- RenameIndex
ALTER TABLE `stockhistory` RENAME INDEX `StockHistory_productId_fkey` TO `StockHistory_productId_idx`;
