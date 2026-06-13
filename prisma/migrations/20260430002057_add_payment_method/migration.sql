-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('DINHEIRO', 'CARTAO', 'PIX');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "formaPagamento" "FormaPagamento";
