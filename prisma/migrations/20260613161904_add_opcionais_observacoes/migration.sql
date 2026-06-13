-- DropIndex
DROP INDEX "OrderItem_orderId_productId_key";

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "observacoes" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "opcionais" JSONB;
