-- Add PARTIAL status to InvoiceStatus enum
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'PARTIAL';

-- Add paidAmount to Invoice
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
