-- CreateEnum
CREATE TYPE "TipoLancamento" AS ENUM ('DINHEIRO', 'PRODUTO');

-- CreateEnum
CREATE TYPE "StatusLancamento" AS ENUM ('PENDENTE', 'PAGO');

-- AlterTable: adiciona campo setor em FuncionarioExterno
ALTER TABLE "FuncionarioExterno" ADD COLUMN "setor" TEXT NOT NULL DEFAULT 'Lava-Rápido';

-- CreateTable: LancamentoVale
CREATE TABLE "LancamentoVale" (
    "id" TEXT NOT NULL,
    "colaboradorId" TEXT NOT NULL,
    "tipo" "TipoLancamento" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "status" "StatusLancamento" NOT NULL DEFAULT 'PENDENTE',
    "registradoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "liquidadoEm" TIMESTAMP(3),

    CONSTRAINT "LancamentoVale_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LancamentoVale" ADD CONSTRAINT "LancamentoVale_colaboradorId_fkey"
    FOREIGN KEY ("colaboradorId") REFERENCES "FuncionarioExterno"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
