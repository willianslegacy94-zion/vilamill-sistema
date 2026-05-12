-- Add CREDITO and DEBITO values to FormaPagamento enum
ALTER TYPE "FormaPagamento" ADD VALUE IF NOT EXISTS 'CREDITO';
ALTER TYPE "FormaPagamento" ADD VALUE IF NOT EXISTS 'DEBITO';
