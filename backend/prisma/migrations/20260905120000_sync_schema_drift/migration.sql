-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "clientNumber" TEXT,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "paymentNumber" TEXT;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "description" TEXT,
ADD COLUMN     "slug" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "userNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
