-- CreateEnum
CREATE TYPE "TipoCreditoFuncionario" AS ENUM ('INDIVIDUAL', 'COLETIVO');

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" DROP DEFAULT,
ALTER COLUMN "senhaHash" DROP DEFAULT;

-- CreateTable
CREATE TABLE "FuncionarioExterno" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FuncionarioExterno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditoFuncionario" (
    "id" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoCreditoFuncionario" NOT NULL DEFAULT 'INDIVIDUAL',
    "loteId" TEXT,
    "registradoPor" TEXT NOT NULL,
    "registradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "liquidado" BOOLEAN NOT NULL DEFAULT false,
    "liquidadoEm" TIMESTAMP(3),

    CONSTRAINT "CreditoFuncionario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsumoFuncionario" (
    "id" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantidade" DECIMAL(10,3) NOT NULL,
    "precoUnit" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "registradoPor" TEXT NOT NULL,
    "registradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "liquidado" BOOLEAN NOT NULL DEFAULT false,
    "liquidadoEm" TIMESTAMP(3),

    CONSTRAINT "ConsumoFuncionario_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CreditoFuncionario" ADD CONSTRAINT "CreditoFuncionario_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "FuncionarioExterno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumoFuncionario" ADD CONSTRAINT "ConsumoFuncionario_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "FuncionarioExterno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumoFuncionario" ADD CONSTRAINT "ConsumoFuncionario_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
