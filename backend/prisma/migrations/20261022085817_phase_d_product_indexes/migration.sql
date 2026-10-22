-- CreateIndex
CREATE INDEX "Product_status_deletedAt_createdAt_idx" ON "Product"("status", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "Product_status_category_idx" ON "Product"("status", "category");

-- CreateIndex
CREATE INDEX "Product_status_featured_idx" ON "Product"("status", "featured");

-- CreateIndex
CREATE INDEX "Product_status_deletedAt_price_idx" ON "Product"("status", "deletedAt", "price");
