-- AlterTable Product: add costPrice, track_inventory, estoque
ALTER TABLE "Product" ADD COLUMN "costPrice" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN "track_inventory" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "estoque" DECIMAL(10,3) NOT NULL DEFAULT 0;

-- AlterTable OrderItem: add custoUnit (historical cost at sale time)
ALTER TABLE "OrderItem" ADD COLUMN "custoUnit" DECIMAL(10,2) NOT NULL DEFAULT 0;
