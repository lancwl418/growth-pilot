-- AlterTable
ALTER TABLE "dim_customers" ADD COLUMN     "is_internal" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "dim_customers_is_internal_idx" ON "dim_customers"("is_internal");
