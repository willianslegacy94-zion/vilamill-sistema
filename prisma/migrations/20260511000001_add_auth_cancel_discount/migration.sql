-- AlterTable User: add email and senhaHash
ALTER TABLE "User" ADD COLUMN "email" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN "senhaHash" TEXT NOT NULL DEFAULT '';

-- CreateIndex unique on User.email
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AlterTable Order: add desconto
ALTER TABLE "Order" ADD COLUMN "desconto" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable CancelamentoLog
CREATE TABLE "CancelamentoLog" (
    "id" TEXT NOT NULL,
    "mesaNumero" INTEGER NOT NULL,
    "motivoCancelamento" TEXT,
    "canceladoPor" TEXT NOT NULL,
    "canceladoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CancelamentoLog_pkey" PRIMARY KEY ("id")
);
