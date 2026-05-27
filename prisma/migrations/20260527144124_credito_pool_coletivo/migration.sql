-- DropForeignKey
ALTER TABLE "CreditoFuncionario" DROP CONSTRAINT "CreditoFuncionario_funcionarioId_fkey";

-- AlterTable
ALTER TABLE "CreditoFuncionario" ADD COLUMN     "empresa" TEXT,
ALTER COLUMN "funcionarioId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "CreditoFuncionario" ADD CONSTRAINT "CreditoFuncionario_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "FuncionarioExterno"("id") ON DELETE SET NULL ON UPDATE CASCADE;
