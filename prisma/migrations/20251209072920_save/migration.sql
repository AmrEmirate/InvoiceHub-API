-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "autoSendEmail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentTermDays" INTEGER,
ADD COLUMN     "recurrenceDay" INTEGER;
