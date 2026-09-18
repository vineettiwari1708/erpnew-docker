-- AlterTable
ALTER TABLE "SystemUser" ADD COLUMN "permissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
